// src/pages/Perfil.tsx
import React, { useEffect, useState } from "react";
import { verMiPerfil, editarMiPerfil, type Perfil, type EditarPerfilPayload } from "../services/Usuarios";
import { motion, AnimatePresence } from "framer-motion";
import "./Perfil.css";

const Pencil = (props: React.SVGProps<SVGSVGElement>) => (
  <motion.svg
    viewBox="0 0 24 24"
    width={16}
    height={16}
    whileHover={{ scale: 1.2 }}
    whileTap={{ scale: 0.9 }}
    {...props}
  >
    <path
      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
      fill="currentColor"
    />
  </motion.svg>
);

type EditableField = "correoelectronico" | "telefono" | "password";

export default function Perfil() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [newValue, setNewValue] = useState<string>("");
  const [passwordConfirm, setPasswordConfirm] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const data = await verMiPerfil();
        setPerfil(data);
      } catch (e: any) {
        setErrorMsg(e?.message || "Error al cargar el perfil");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openEdit = (field: EditableField) => {
    setEditingField(field);
    if (field === "password") {
      setNewValue("");
      setPasswordConfirm("");
    } else {
      setNewValue((perfil as any)?.[field] ?? "");
    }
  };

  const closeEdit = () => {
    setEditingField(null);
    setNewValue("");
    setPasswordConfirm("");
  };

  const confirmEdit = async () => {
    if (!editingField) return;

    try {
      const payload: EditarPerfilPayload = {};

      if (editingField === "password") {
        if (!newValue || !passwordConfirm) {
          alert("Por favor, completa ambos campos de contraseña");
          return;
        }
        if (newValue !== passwordConfirm) {
          alert("Las contraseñas no coinciden");
          return;
        }
        if (newValue.length < 6) {
          alert("La contraseña debe tener al menos 6 caracteres");
          return;
        }
        payload.password = newValue;
        payload.password_confirm = passwordConfirm;
      } else {
        payload[editingField] = newValue;
      }

      const updated = await editarMiPerfil(payload);
      setPerfil(updated);
      closeEdit();

      if (editingField === "password") {
        alert("Contraseña actualizada correctamente");
      }
    } catch (e: any) {
      alert(e?.message || "No se pudo actualizar");
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Cargando…</div>;
  if (errorMsg) return <div style={{ padding: 24, color: "crimson" }}>{errorMsg}</div>;
  if (!perfil) return <div style={{ padding: 24 }}>Sin datos.</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="perfil-container"
    >
      <motion.h1
        className="perfil-title"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        Mi perfil
      </motion.h1>
      <motion.p
        className="perfil-subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Código: <b>{perfil.codigo}</b> · Rol ID: <b>{perfil.idtipousuario}</b>
      </motion.p>

      <motion.div
        className="perfil-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        {/* Campos de solo lectura */}
        <motion.div
          className="perfil-field readonly"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="field-label">Nombre</div>
          <div className="field-value">{perfil.nombre}</div>
        </motion.div>

        <motion.div
          className="perfil-field readonly"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="field-label">Apellido</div>
          <div className="field-value">{perfil.apellido}</div>
        </motion.div>

        <motion.div
          className="perfil-field readonly"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="field-label">Sexo</div>
          <div className="field-value">{perfil.sexo || "—"}</div>
        </motion.div>

        <motion.div
          className="perfil-field readonly"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="field-label">Recibir notificaciones</div>
          <div className="field-value">{perfil.recibir_notificaciones ? "Sí" : "No"}</div>
        </motion.div>

        {/* Campos editables */}
        <motion.div
          className="perfil-field editable"
          whileHover={{ backgroundColor: "#f8fafc" }}
        >
          <div className="field-label">Correo electrónico</div>
          <div className="field-value">{perfil.correoelectronico}</div>
          <motion.button
            className="edit-button"
            onClick={() => openEdit("correoelectronico")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Pencil />
          </motion.button>
        </motion.div>

        <motion.div
          className="perfil-field editable"
          whileHover={{ backgroundColor: "#f8fafc" }}
        >
          <div className="field-label">Teléfono</div>
          <div className="field-value">{perfil.telefono || "—"}</div>
          <motion.button
            className="edit-button"
            onClick={() => openEdit("telefono")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Pencil />
          </motion.button>
        </motion.div>

        <motion.div
          className="perfil-field editable"
          whileHover={{ backgroundColor: "#f8fafc" }}
        >
          <div className="field-label">Contraseña</div>
          <div className="field-value">••••••••</div>
          <motion.button
            className="edit-button"
            onClick={() => openEdit("password")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Pencil />
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {editingField && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeEdit}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
                {editingField === "correoelectronico"
                  ? "Editar correo electrónico"
                  : editingField === "telefono"
                  ? "Editar teléfono"
                  : "Cambiar contraseña"}
              </h2>

              {editingField === "password" ? (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      style={{
                        width: "100%",
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        padding: "10px 12px",
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="Repite la contraseña"
                      style={{
                        width: "100%",
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        padding: "10px 12px",
                      }}
                    />
                  </div>
                </>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <input
                    type={editingField === "correoelectronico" ? "email" : "text"}
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder={
                      editingField === "correoelectronico"
                        ? "Nuevo correo electrónico"
                        : "Nuevo teléfono (8 dígitos)"
                    }
                    style={{
                      width: "100%",
                      border: "1px solid #d1d5db",
                      borderRadius: 8,
                      padding: "10px 12px",
                    }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  onClick={closeEdit}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmEdit}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #2563eb",
                    background: "#2563eb",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}