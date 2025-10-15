import { useEffect, useMemo, useState } from "react";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import {
  listarEstadosConsulta,
  listarPoliticasNoShow,
  crearPoliticaNoShow,
  actualizarPoliticaNoShow,
  eliminarPoliticaNoShow,
  type EstadoConsulta,
  type PoliticaNoShow,
  type PoliticaNoShowListResponse,
} from "../services/PoliticasNoShow";
import { TENANT_SUBDOMAIN } from "../lib/Api";

type PoliticaNoShowForm = {
  nombre: string;
  estado_consulta: number | "";
  penalizacion_economica: string;
  bloqueo_temporal: boolean;
  reprogramacion_obligatoria: boolean;
  alerta_interna: boolean;
  notificacion_paciente: boolean;
  notificacion_profesional: boolean;
  dias_bloqueo: string;
  activo: boolean;
};

const initialForm: PoliticaNoShowForm = {
  nombre: "",
  estado_consulta: "",
  penalizacion_economica: "",
  bloqueo_temporal: false,
  reprogramacion_obligatoria: false,
  alerta_interna: false,
  notificacion_paciente: false,
  notificacion_profesional: false,
  dias_bloqueo: "",
  activo: true,
};

export default function CrearPoliticaNoShow() {
  const auth = useAuth() as any;
  const { user, isAuth, loading } = auth;

  const authToken: string | undefined =
    auth?.token || (user as any)?.token || localStorage.getItem("token") || undefined;

  // Estados catálogo
  const [estados, setEstados] = useState<EstadoConsulta[]>([]);
  const [loadingEstados, setLoadingEstados] = useState<boolean>(true);

  // Formulario (crear/editar)
  const [form, setForm] = useState<PoliticaNoShowForm>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Mensajes / flags
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Lista de políticas
  const [politicas, setPoliticas] = useState<PoliticaNoShow[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [loadingList, setLoadingList] = useState<boolean>(true);

  // Filtros/búsqueda/orden
  const [search, setSearch] = useState<string>("");
  const [filtroActivo, setFiltroActivo] = useState<"" | "true" | "false">("");
  const [filtroEstado, setFiltroEstado] = useState<number | "">("");
  const [ordering, setOrdering] = useState<string>("id"); // backend soporta "id", "-id", "penalizacion_economica", etc.

  const isAdmin = useMemo(() => {
    const u = user as any;
    const tipo = u?.idtipousuario ?? u?.usuario?.idtipousuario ?? 0;
    return Number(tipo) === 1;
  }, [user]);

  // Helpers
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }
  function formatMoney(v?: string | number | null) {
    const n = Number(v ?? 0);
    return n.toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2 });
  }

  // Cargar Estados
  useEffect(() => {
    let alive = true;
    async function loadEstados() {
      try {
        setLoadingEstados(true);
        setError(null);
        if (!authToken) throw new Error("No se encontró token de autenticación.");
        const data = await listarEstadosConsulta(authToken);
        if (!alive) return;
        setEstados(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!alive) return;
        setEstados([]);
        const msg =
          e?.response?.data?.detail ||
          e?.message ||
          "No se pudo cargar la lista de estados de consulta.";
        setError(msg);
      } finally {
        if (alive) setLoadingEstados(false);
      }
    }
    if (isAuth) loadEstados();
    return () => {
      alive = false;
    };
  }, [isAuth, authToken]);

  // Cargar Políticas
  useEffect(() => {
    let alive = true;
    async function loadPoliticas() {
      if (!authToken) return;
      try {
        setLoadingList(true);
        const params = {
          page,
          page_size: pageSize,
          search: search || undefined,
          activo: filtroActivo || undefined,
          estado_consulta: filtroEstado || undefined,
          ordering: ordering || undefined,
        };
        const res: PoliticaNoShowListResponse = await listarPoliticasNoShow(authToken, params as any);
        if (!alive) return;
        setPoliticas(res.results);
        setCount(res.count);
      } catch (e: any) {
        if (!alive) return;
        setPoliticas([]);
        setCount(0);
        const msg =
          e?.response?.data?.detail ||
          e?.message ||
          "No se pudo cargar la lista de políticas.";
        setError(msg);
      } finally {
        if (alive) setLoadingList(false);
      }
    }
    if (isAuth) loadPoliticas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, authToken, page, pageSize, search, filtroActivo, filtroEstado, ordering]);

  if (!isAuth && !loading) return <Navigate to="/login" replace />;
  if (!loading && isAuth && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-xl font-semibold text-gray-900">Acceso restringido</h1>
          <p className="text-gray-600">Solo los administradores pueden gestionar políticas de no show.</p>
        </div>
      </div>
    );
  }

  // Validación
  function validar(values: PoliticaNoShowForm): string | null {
    if (!values.nombre.trim()) return "El nombre es obligatorio.";
    if (!values.estado_consulta) return "Debes seleccionar un estado de consulta.";
    if (values.bloqueo_temporal) {
      const d = Number(values.dias_bloqueo || 0);
      if (!d || d <= 0) return "Días de bloqueo debe ser mayor a 0 cuando el bloqueo está activo.";
    }
    return null;
  }

  // Handlers de Form
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      if (type === "checkbox") return { ...prev, [name]: checked };
      if (name === "estado_consulta")
        return { ...prev, estado_consulta: value === "" ? "" : Number(value) };
      return { ...prev, [name]: value };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const msg = validar(form);
    if (msg) {
      setError(msg);
      return;
    }
    if (!authToken) {
      setError("No se encontró token de autenticación.");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        nombre: form.nombre || null,
        estado_consulta: form.estado_consulta,
        penalizacion_economica:
          form.penalizacion_economica === "" ? null : form.penalizacion_economica,
        bloqueo_temporal: form.bloqueo_temporal,
        reprogramacion_obligatoria: form.reprogramacion_obligatoria,
        alerta_interna: form.alerta_interna,
        notificacion_paciente: form.notificacion_paciente,
        notificacion_profesional: form.notificacion_profesional,
        dias_bloqueo: form.bloqueo_temporal
          ? form.dias_bloqueo === ""
            ? null
            : Number(form.dias_bloqueo)
          : null,
        activo: form.activo,
      };

      if (editingId) {
        await actualizarPoliticaNoShow(editingId, payload, authToken);
        setSuccess("¡Política actualizada correctamente!");
      } else {
        await crearPoliticaNoShow(payload, authToken);
        setSuccess("¡Política creada correctamente!");
      }
      // Refrescar lista
      setPage(1);
      setSearch("");
      resetForm();
      // Re-disparar carga
      // Nota: dependencias del useEffect de lista ya reaccionan a page.
    } catch (e: any) {
      const msgBackend =
        e?.response?.data?.detail ||
        e?.response?.data?.non_field_errors?.[0] ||
        e?.message ||
        (editingId ? "No se pudo actualizar la política." : "No se pudo crear la política.");
      setError(msgBackend);
    } finally {
      setSaving(false);
    }
  }

  function onEditClick(p: PoliticaNoShow) {
    setEditingId(p.id);
    setForm({
      nombre: p.nombre ?? "",
      estado_consulta: p.estado_consulta,
      penalizacion_economica:
        p.penalizacion_economica != null ? String(p.penalizacion_economica) : "",
      bloqueo_temporal: !!p.bloqueo_temporal,
      reprogramacion_obligatoria: !!p.reprogramacion_obligatoria,
      alerta_interna: !!p.alerta_interna,
      notificacion_paciente: !!p.notificacion_paciente,
      notificacion_profesional: !!p.notificacion_profesional,
      dias_bloqueo: p.dias_bloqueo != null ? String(p.dias_bloqueo) : "",
      activo: !!p.activo,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onDeleteClick(p: PoliticaNoShow) {
    if (!authToken) return;
    const ok = window.confirm(
      `¿Eliminar la política "${p.nombre || `#${p.id}`}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    try {
      await eliminarPoliticaNoShow(p.id, authToken);
      setSuccess("Política eliminada.");
      // Refrescar
      setPoliticas((prev) => prev.filter((x) => x.id !== p.id));
      setCount((c) => Math.max(0, c - 1));
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail || e?.message || "No se pudo eliminar la política.";
      setError(msg);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white">
      <TopBar />
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <header className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingId ? "Editar política no show" : "Crear política no show"}
          </h2>
          <p className="text-gray-600">
            {editingId
              ? "Modifica los datos de la política seleccionada."
              : "Ingresa los datos para crear una nueva política."}
          </p>
        </header>

        {/* Contexto */}
        <div className="mb-4 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-800">
          <span className="font-semibold">Contexto:</span>{" "}
          Tenant: <span className="font-medium">{TENANT_SUBDOMAIN ?? "no detectado"}</span> • Estados
          cargados: {loadingEstados ? "…" : estados.length} • Políticas:{" "}
          {loadingList ? "…" : count}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </div>
        )}

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-6 rounded-xl border border-cyan-100 shadow-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre de la política
              </label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Ej: No show con multa"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estado de consulta
              </label>
              <select
                name="estado_consulta"
                value={form.estado_consulta}
                onChange={handleChange}
                disabled={loadingEstados || estados.length === 0}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100"
                required
              >
                <option value="">
                  {loadingEstados ? "Cargando estados…" : "Selecciona un estado…"}
                </option>
                {estados.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.estado}
                  </option>
                ))}
              </select>
              {!loadingEstados && estados.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  No hay estados disponibles para tu empresa. Tenant:{" "}
                  <span className="font-medium">{TENANT_SUBDOMAIN ?? "no detectado"}</span>.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Penalización económica
              </label>
              <input
                type="number"
                name="penalizacion_economica"
                value={form.penalizacion_economica}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="flex items-center">
              <input
                id="activo"
                type="checkbox"
                name="activo"
                checked={form.activo}
                onChange={handleChange}
                className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
              />
              <label htmlFor="activo" className="ml-2 text-sm text-gray-700">
                Activo
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
            <div className="flex items-center">
              <input
                id="bloqueo_temporal"
                type="checkbox"
                name="bloqueo_temporal"
                checked={form.bloqueo_temporal}
                onChange={handleChange}
                className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
              />
              <label htmlFor="bloqueo_temporal" className="ml-2 text-sm text-gray-700">
                Bloqueo temporal
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="reprogramacion_obligatoria"
                type="checkbox"
                name="reprogramacion_obligatoria"
                checked={form.reprogramacion_obligatoria}
                onChange={handleChange}
                className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
              />
              <label htmlFor="reprogramacion_obligatoria" className="ml-2 text-sm text-gray-700">
                Reprogramación obligatoria
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="alerta_interna"
                type="checkbox"
                name="alerta_interna"
                checked={form.alerta_interna}
                onChange={handleChange}
                className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
              />
              <label htmlFor="alerta_interna" className="ml-2 text-sm text-gray-700">
                Alerta interna
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="notificacion_paciente"
                type="checkbox"
                name="notificacion_paciente"
                checked={form.notificacion_paciente}
                onChange={handleChange}
                className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
              />
              <label htmlFor="notificacion_paciente" className="ml-2 text-sm text-gray-700">
                Notificación paciente
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="notificacion_profesional"
                type="checkbox"
                name="notificacion_profesional"
                checked={form.notificacion_profesional}
                onChange={handleChange}
                className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
              />
              <label htmlFor="notificacion_profesional" className="ml-2 text-sm text-gray-700">
                Notificación profesional
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Días de bloqueo</label>
              <input
                type="number"
                name="dias_bloqueo"
                value={form.dias_bloqueo}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                min="0"
                placeholder="Ej: 2"
                disabled={!form.bloqueo_temporal}
              />
              {!form.bloqueo_temporal && (
                <p className="mt-1 text-xs text-gray-500">
                  Habilita “Bloqueo temporal” para activar este campo.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center rounded-lg bg-cyan-600 px-4 py-2 text-white font-semibold hover:bg-cyan-700 disabled:bg-cyan-300"
            >
              {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear política"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex justify-center rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>

        {/* Listado y acciones */}
        <section className="mt-8 bg-white p-6 rounded-xl border border-cyan-100 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              <div>
                <label className="block text-sm font-medium text-gray-700">Buscar</label>
                <input
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  placeholder="Nombre…"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Activo</label>
                <select
                  value={filtroActivo}
                  onChange={(e) => {
                    setPage(1);
                    setFiltroActivo(e.target.value as any);
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Todos</option>
                  <option value="true">Solo activos</option>
                  <option value="false">Solo inactivos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <select
                  value={filtroEstado}
                  onChange={(e) => {
                    setPage(1);
                    setFiltroEstado(e.target.value === "" ? "" : Number(e.target.value));
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Todos</option>
                  {estados.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.estado}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Ordenar por</label>
              <select
                value={ordering}
                onChange={(e) => {
                  setPage(1);
                  setOrdering(e.target.value);
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="id">ID ↑</option>
                <option value="-id">ID ↓</option>
                <option value="penalizacion_economica">Multa ↑</option>
                <option value="-penalizacion_economica">Multa ↓</option>
                <option value="dias_bloqueo">Días bloqueo ↑</option>
                <option value="-dias_bloqueo">Días bloqueo ↓</option>
              </select>
            </div>
          </div>

          {/* Tabla responsive */}
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-3 py-2 text-left font-semibold text-gray-700">ID</th>
                  <th className="px-2 sm:px-3 py-2 text-left font-semibold text-gray-700">
                    Nombre
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left font-semibold text-gray-700">
                    Estado
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left font-semibold text-gray-700">
                    Multa
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left font-semibold text-gray-700">
                    Bloqueo
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-left font-semibold text-gray-700">
                    Activo
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-right font-semibold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingList ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                      Cargando políticas…
                    </td>
                  </tr>
                ) : politicas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                      No hay políticas para mostrar.
                    </td>
                  </tr>
                ) : (
                  politicas.map((p) => {
                    const estadoNombre =
                      (p as any).estado_consulta_nombre ||
                      estados.find((e) => e.id === p.estado_consulta)?.estado ||
                      `#${p.estado_consulta}`;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-3 py-2 text-gray-700">{p.id}</td>
                        <td className="px-2 sm:px-3 py-2 text-gray-900">{p.nombre || "—"}</td>
                        <td className="px-2 sm:px-3 py-2 text-gray-700">{estadoNombre}</td>
                        <td className="px-2 sm:px-3 py-2 text-gray-700">
                          {formatMoney(p.penalizacion_economica)}
                        </td>
                        <td className="px-2 sm:px-3 py-2">
                          {p.bloqueo_temporal ? (
                            <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-200">
                              {p.dias_bloqueo ?? 0} días
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-2 sm:px-3 py-2">
                          {p.activo ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => onEditClick(p)}
                              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => onDeleteClick(p)}
                              className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              Mostrando{" "}
              <span className="font-medium">
                {politicas.length === 0 ? 0 : (page - 1) * pageSize + 1}
              </span>{" "}
              a{" "}
              <span className="font-medium">
                {(page - 1) * pageSize + politicas.length}
              </span>{" "}
              de <span className="font-medium">{count}</span> políticas
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || loadingList}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50 hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-700">
                Página {page} de {totalPages}
              </span>
              <button
                disabled={page >= totalPages || loadingList}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50 hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}