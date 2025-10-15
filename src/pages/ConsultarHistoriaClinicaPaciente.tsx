// src/pages/ConsultarHistoriaClinicaPaciente.tsx
import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import ProtectedRoute from "../components/ProtectedRoute";
import { Api } from "../lib/Api";
import { Toaster, toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

type HCEItem = {
  id: number;
  pacientecodigo: number;
  episodio: number;
  fecha: string; // ISO
  alergias?: string | null;
  enfermedades?: string | null;
  motivoconsulta?: string | null;
  diagnostico?: string | null;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
} | T[];

function isPaginated<T>(data: Paginated<T>): data is Exclude<Paginated<T>, T[]> {
  return !!(data as any)?.results;
}

export default function ConsultarHistoriaClinicaPaciente() {
  const { user } = useAuth(); // user.codigo = PK de Usuario, coincide con PK de Paciente (codusuario)
  const pacienteId = user?.codigo as number | undefined;

  const [historias, setHistorias] = useState<HCEItem[]>([]);
  const [hCount, setHCount] = useState<number>(0);
  const [hNext, setHNext] = useState<string | null>(null);
  const [hPrev, setHPrev] = useState<string | null>(null);
  const [loadingHistorias, setLoadingHistorias] = useState(false);

  const fetchHistorias = async (pageUrl?: string) => {
    if (!pacienteId) return;
    setLoadingHistorias(true);
    try {
      let data: any;
      if (pageUrl) {
        const res = await Api.get(pageUrl);
        data = res.data;
      } else {
        const res = await Api.get(
          `/historias-clinicas/?paciente=${pacienteId}&ordering=-fecha&pagesize=10&page=1`
        );
        data = res.data;
      }

      if (isPaginated<HCEItem>(data)) {
        setHistorias(data.results ?? []);
        setHCount(data.count ?? 0);
        setHNext(data.next ?? null);
        setHPrev(data.previous ?? null);
      } else {
        setHistorias((data as HCEItem[]) ?? []);
        setHCount(Array.isArray(data) ? data.length : 0);
        setHNext(null);
        setHPrev(null);
      }
    } catch {
      toast.error("No se pudo cargar tu historial clínico.");
      setHistorias([]);
      setHCount(0);
      setHNext(null);
      setHPrev(null);
    } finally {
      setLoadingHistorias(false);
    }
  };

  useEffect(() => {
    if (pacienteId) fetchHistorias();
  }, [pacienteId]);

  const fmtDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleString() : "-";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white">
        <TopBar />
        <Toaster />

        <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <header className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
              Mi Historia Clínica
            </h1>
            <p className="text-gray-500">
              Aquí puedes ver tus episodios registrados por la clínica.
            </p>
          </header>

          <section className="bg-white rounded-2xl shadow p-4 sm:p-6">
            {!pacienteId ? (
              <p className="text-gray-500">No se pudo identificar tu perfil de paciente.</p>
            ) : loadingHistorias ? (
              <p className="text-gray-500">Cargando…</p>
            ) : historias.length === 0 ? (
              <p className="text-gray-500">Aún no tienes registros de historia clínica.</p>
            ) : (
              <>
                <div className="overflow-auto border rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2">Fecha</th>
                        <th className="text-left p-2">Episodio</th>
                        <th className="text-left p-2">Motivo</th>
                        <th className="text-left p-2">Diagnóstico</th>
                        <th className="text-left p-2">Alergias</th>
                        <th className="text-left p-2">Enfermedades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historias.map((h) => (
                        <tr key={h.id} className="border-t">
                          <td className="p-2 whitespace-nowrap">{fmtDate(h.fecha)}</td>
                          <td className="p-2">{h.episodio}</td>
                          <td className="p-2">{h.motivoconsulta || "-"}</td>
                          <td className="p-2">{h.diagnostico || "-"}</td>
                          <td className="p-2">{h.alergias || "-"}</td>
                          <td className="p-2">{h.enfermedades || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {(hNext || hPrev) && (
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-600">
                      {hCount} registro{hCount === 1 ? "" : "s"}
                    </span>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 border rounded-lg disabled:opacity-50"
                        disabled={!hPrev}
                        onClick={() => hPrev && fetchHistorias(hPrev)}
                      >
                        ← Anterior
                      </button>
                      <button
                        className="px-3 py-1 border rounded-lg disabled:opacity-50"
                        disabled={!hNext}
                        onClick={() => hNext && fetchHistorias(hNext)}
                      >
                        Siguiente →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
