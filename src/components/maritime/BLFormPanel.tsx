"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, Download, ChevronDown, ChevronUp, X, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  generateBLComplete,
  nextBLNumber,
  saveBLRecord,
  loadBLRecords,
  type BLData,
  type BLContainer,
  type BLRecord,
} from "@/lib/pdf/bl-generator";
import type { Vessel } from "@/hooks/useMaritimeData";

// ─── Types locaux ─────────────────────────────────────────────────────────────

interface BLFormPanelProps {
  vessel: Vessel | null;
  onClose: () => void;
}

// ─── Helpers UI ──────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "0.375rem",
  color: "#e2e8f0",
  fontSize: "0.72rem",
  padding: "0.35rem 0.5rem",
  width: "100%",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.6rem",
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "0.2rem",
  display: "block",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "0.65rem",
  color: "#D4AF37",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  borderBottom: "1px solid rgba(212,175,55,0.2)",
  paddingBottom: "0.3rem",
  marginBottom: "0.5rem",
};

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function BLFormPanel({ vessel, onClose }: BLFormPanelProps) {
  const [blNumber, setBlNumber] = useState("");
  const [section, setSection]  = useState<"form" | "list">("form");
  const [records, setRecords]   = useState<BLRecord[]>([]);

  // ── Formulaire state ──────────────────────────────────────────────────────
  const [form, setForm] = useState({
    voyage:             "",
    portLoading:        "Port Autonome d'Abidjan",
    portDischarge:      vessel?.destination ?? "",
    placeDelivery:      vessel?.destination ?? "",
    shipper:            "ORION Shipping Abidjan",
    shipperAddress:     "Zone Portuaire, Abidjan, Côte d'Ivoire",
    consignee:          "",
    consigneeAddress:   "",
    notifyParty:        "",
    cargo:              (vessel as Vessel & { cargo?: string })?.cargo ?? "",
    marks:              "",
    grossWeight:        String((vessel as Vessel & { tonnage?: number })?.tonnage ?? 0),
    totalVolume:        "",
    freightTerms:       "Prepaid" as BLData["freightTerms"],
    freightAmount:      "",
    freightCurrency:    "USD",
    originalCount:      "3",
    specialInstructions: "",
  });

  const [containers, setContainers] = useState<BLContainer[]>([]);
  const [showContainerForm, setShowContainerForm] = useState(false);
  const [newContainer, setNewContainer] = useState<Partial<BLContainer>>({
    type: "20", count: 1, weight: 0, volume: 0,
  });

  useEffect(() => {
    setBlNumber(nextBLNumber());
    setRecords(loadBLRecords());
  }, []);

  useEffect(() => {
    if (vessel) {
      setForm(f => ({
        ...f,
        portDischarge:  vessel.destination,
        placeDelivery:  vessel.destination,
        cargo:          (vessel as Vessel & { cargo?: string }).cargo ?? f.cargo,
        grossWeight:    String((vessel as Vessel & { tonnage?: number }).tonnage ?? f.grossWeight),
      }));
    }
  }, [vessel]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }, []);

  const addContainer = useCallback(() => {
    if (!newContainer.number || !newContainer.count) return;
    setContainers(prev => [...prev, newContainer as BLContainer]);
    setNewContainer({ type: "20", count: 1, weight: 0, volume: 0 });
    setShowContainerForm(false);
  }, [newContainer]);

  const removeContainer = useCallback((idx: number) => {
    setContainers(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleGenerate = useCallback(() => {
    const blData: BLData = {
      blNumber,
      shipName:    vessel?.name ?? "—",
      imo:         vessel?.imo ?? "—",
      flag:        (vessel as Vessel & { flag?: string })?.flag ?? "CI",
      voyage:      form.voyage,
      portLoading: form.portLoading,
      portDischarge: form.portDischarge,
      placeDelivery: form.placeDelivery,
      shipper:     form.shipper,
      shipperAddress: form.shipperAddress,
      consignee:   form.consignee || "À ORDRE / TO ORDER",
      consigneeAddress: form.consigneeAddress,
      notifyParty: form.notifyParty,
      cargo:       form.cargo,
      marks:       form.marks,
      containers,
      grossWeight: parseFloat(form.grossWeight) || 0,
      totalVolume: parseFloat(form.totalVolume) || 0,
      freightTerms:    form.freightTerms,
      freightAmount:   form.freightAmount ? parseFloat(form.freightAmount) : undefined,
      freightCurrency: form.freightCurrency,
      issueDate:   new Date().toLocaleDateString("fr-FR"),
      eta:         vessel?.eta ?? "—",
      originalCount: parseInt(form.originalCount) as 1 | 2 | 3,
      specialInstructions: form.specialInstructions,
    };

    generateBLComplete(blData);
    const record: BLRecord = {
      blNumber,
      shipName:  vessel?.name ?? "—",
      cargo:     form.cargo,
      issueDate: blData.issueDate,
      tonnage:   blData.grossWeight,
    };
    saveBLRecord(record);
    setRecords(loadBLRecords());
    setBlNumber(nextBLNumber());
  }, [blNumber, vessel, form, containers]);

  const panelStyle: React.CSSProperties = {
    position: "absolute",
    right: "4px",
    top: "4px",
    bottom: "4px",
    width: "320px",
    background: "rgba(3,9,18,0.97)",
    border: "1px solid rgba(212,175,55,0.25)",
    borderRadius: "0.75rem",
    backdropFilter: "blur(16px)",
    display: "flex",
    flexDirection: "column",
    zIndex: 40,
    overflow: "hidden",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      style={panelStyle}
    >
      {/* Header */}
      <div style={{
        background: "rgba(6,14,26,0.9)",
        borderBottom: "1px solid rgba(212,175,55,0.2)",
        padding: "0.75rem 1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        flexShrink: 0,
      }}>
        <FileText size={14} color="#D4AF37" />
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Connaissement B/L
        </span>
        <span style={{
          fontSize: "0.6rem",
          color: "#475569",
          background: "rgba(255,255,255,0.05)",
          padding: "0.1rem 0.4rem",
          borderRadius: "0.25rem",
          fontFamily: "monospace",
          marginLeft: "auto",
        }}>
          {blNumber}
        </span>
        <button onClick={onClose} style={{ color: "#475569", cursor: "pointer", marginLeft: "0.25rem" }}>
          <X size={14} />
        </button>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        {(["form", "list"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setSection(tab)}
            style={{
              flex: 1,
              padding: "0.5rem",
              fontSize: "0.68rem",
              fontWeight: 600,
              cursor: "pointer",
              background: section === tab ? "rgba(212,175,55,0.1)" : "transparent",
              color: section === tab ? "#D4AF37" : "#475569",
              borderBottom: `2px solid ${section === tab ? "#D4AF37" : "transparent"}`,
              transition: "all 0.15s",
            }}
          >
            {tab === "form" ? "Nouveau B/L" : `Historique (${records.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }}>

        {/* ── Formulaire ── */}
        {section === "form" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Navire */}
            <div>
              <p style={sectionTitle}>Navire</p>
              {vessel ? (
                <div style={{
                  background: "rgba(56,189,248,0.07)",
                  border: "1px solid rgba(56,189,248,0.2)",
                  borderRadius: "0.4rem",
                  padding: "0.5rem 0.6rem",
                }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e2e8f0" }}>{vessel.name}</p>
                  <p style={{ fontSize: "0.65rem", color: "#64748b", marginTop: "0.15rem" }}>
                    IMO {vessel.imo} · {vessel.type} · {(vessel as Vessel & { flag?: string }).flag ?? "—"}
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: "0.7rem", color: "#475569", fontStyle: "italic" }}>
                  Sélectionnez un navire sur la carte
                </p>
              )}
            </div>

            {/* Voyage */}
            <div>
              <p style={sectionTitle}>Voyage & Ports</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                <Field label="N° Voyage" name="voyage" value={form.voyage} onChange={handleChange} placeholder="V2026-042" />
                <div>
                  <label style={labelStyle}>Fret</label>
                  <select name="freightTerms" value={form.freightTerms} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="Prepaid">Prepaid</option>
                    <option value="Collect">Collect</option>
                    <option value="As Arranged">As Arranged</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: "0.4rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                <Field label="Port chargement" name="portLoading" value={form.portLoading} onChange={handleChange} />
                <Field label="Port déchargement" name="portDischarge" value={form.portDischarge} onChange={handleChange} />
              </div>
              <div style={{ marginTop: "0.4rem" }}>
                <Field label="Lieu de livraison" name="placeDelivery" value={form.placeDelivery} onChange={handleChange} />
              </div>
            </div>

            {/* Parties */}
            <div>
              <p style={sectionTitle}>Parties</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <Field label="Chargeur (Shipper)" name="shipper" value={form.shipper} onChange={handleChange} />
                <Field label="Adresse chargeur" name="shipperAddress" value={form.shipperAddress} onChange={handleChange} />
                <Field label="Destinataire (Consignee)" name="consignee" value={form.consignee} onChange={handleChange} placeholder="À ORDRE / TO ORDER" />
                <Field label="Adresse destinataire" name="consigneeAddress" value={form.consigneeAddress} onChange={handleChange} />
                <Field label="Partie à notifier" name="notifyParty" value={form.notifyParty} onChange={handleChange} placeholder="Même que destinataire" />
              </div>
            </div>

            {/* Cargo */}
            <div>
              <p style={sectionTitle}>Marchandises</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <div>
                  <label style={labelStyle}>Description cargo</label>
                  <textarea
                    name="cargo"
                    value={form.cargo}
                    onChange={handleChange}
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>
                <Field label="Marques & numéros" name="marks" value={form.marks} onChange={handleChange} placeholder="ORION/2026/001..." />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                  <Field label="Poids brut (kg)" name="grossWeight" value={form.grossWeight} onChange={handleChange} type="number" />
                  <Field label="Volume (m³)" name="totalVolume" value={form.totalVolume} onChange={handleChange} type="number" placeholder="0.00" />
                </div>
              </div>

              {/* Conteneurs */}
              <div style={{ marginTop: "0.6rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.62rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Conteneurs ({containers.length})
                  </span>
                  <button
                    onClick={() => setShowContainerForm(v => !v)}
                    style={{
                      fontSize: "0.6rem",
                      color: "#D4AF37",
                      background: "rgba(212,175,55,0.1)",
                      border: "1px solid rgba(212,175,55,0.2)",
                      borderRadius: "0.25rem",
                      padding: "0.15rem 0.4rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.2rem",
                    }}
                  >
                    <Plus size={10} /> Ajouter
                  </button>
                </div>

                <AnimatePresence>
                  {showContainerForm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{
                        overflow: "hidden",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "0.4rem",
                        padding: "0.5rem",
                        marginBottom: "0.4rem",
                      }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.3rem", marginBottom: "0.3rem" }}>
                        <div>
                          <label style={labelStyle}>N° Conteneur</label>
                          <input
                            value={newContainer.number ?? ""}
                            onChange={e => setNewContainer(p => ({ ...p, number: e.target.value }))}
                            placeholder="MSCU3421567"
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Type</label>
                          <select
                            value={newContainer.type ?? "20"}
                            onChange={e => setNewContainer(p => ({ ...p, type: e.target.value as BLContainer["type"] }))}
                            style={{ ...inputStyle, cursor: "pointer" }}
                          >
                            <option value="20">20'</option>
                            <option value="40">40'</option>
                            <option value="40HC">40' HC</option>
                            <option value="45">45'</option>
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Quantité</label>
                          <input
                            type="number" min={1}
                            value={newContainer.count ?? 1}
                            onChange={e => setNewContainer(p => ({ ...p, count: parseInt(e.target.value) }))}
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>N° Plombs</label>
                          <input
                            value={newContainer.sealNo ?? ""}
                            onChange={e => setNewContainer(p => ({ ...p, sealNo: e.target.value }))}
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Poids (kg)</label>
                          <input
                            type="number"
                            value={newContainer.weight ?? 0}
                            onChange={e => setNewContainer(p => ({ ...p, weight: parseFloat(e.target.value) }))}
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Volume (m³)</label>
                          <input
                            type="number" step="0.1"
                            value={newContainer.volume ?? 0}
                            onChange={e => setNewContainer(p => ({ ...p, volume: parseFloat(e.target.value) }))}
                            style={inputStyle}
                          />
                        </div>
                      </div>
                      <button
                        onClick={addContainer}
                        style={{
                          width: "100%",
                          padding: "0.35rem",
                          background: "rgba(212,175,55,0.15)",
                          border: "1px solid rgba(212,175,55,0.3)",
                          borderRadius: "0.25rem",
                          color: "#D4AF37",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Confirmer conteneur
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {containers.map((c, i) => (
                  <div key={i} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "0.3rem",
                    padding: "0.3rem 0.5rem",
                    marginBottom: "0.25rem",
                  }}>
                    <Package size={11} color="#38bdf8" />
                    <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontFamily: "monospace", flex: 1 }}>
                      {c.number} · {c.count}×{c.type}&apos; · {c.weight.toLocaleString()}kg
                    </span>
                    <button onClick={() => removeContainer(i)} style={{ color: "#475569", cursor: "pointer" }}>
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Fret */}
            <div>
              <p style={sectionTitle}>Fret</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                <Field label="Montant" name="freightAmount" value={form.freightAmount} onChange={handleChange} type="number" placeholder="0.00" />
                <div>
                  <label style={labelStyle}>Devise</label>
                  <select name="freightCurrency" value={form.freightCurrency} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option>USD</option>
                    <option>EUR</option>
                    <option>XOF</option>
                    <option>GBP</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Options */}
            <div>
              <p style={sectionTitle}>Options</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                <div>
                  <label style={labelStyle}>Originaux</label>
                  <select name="originalCount" value={form.originalCount} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="1">1 original</option>
                    <option value="2">2 originaux</option>
                    <option value="3">3 originaux</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: "0.4rem" }}>
                <label style={labelStyle}>Instructions spéciales</label>
                <textarea
                  name="specialInstructions"
                  value={form.specialInstructions}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Conditions particulières, température, dangerosité..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Historique ── */}
        {section === "list" && (
          <div>
            {records.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "#475569" }}>
                <FileText size={32} color="#1e3a5f" style={{ margin: "0 auto 0.5rem" }} />
                <p style={{ fontSize: "0.75rem" }}>Aucun B/L généré</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {records.map((r, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "0.5rem",
                    padding: "0.6rem 0.75rem",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#D4AF37", fontFamily: "monospace" }}>
                        {r.blNumber}
                      </span>
                      <span style={{ fontSize: "0.6rem", color: "#475569" }}>{r.issueDate}</span>
                    </div>
                    <p style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.2rem" }}>{r.shipName}</p>
                    <p style={{ fontSize: "0.65rem", color: "#475569", marginTop: "0.1rem" }}>
                      {r.cargo} · {r.tonnage.toLocaleString()} kg
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer — bouton génération */}
      {section === "form" && (
        <div style={{
          padding: "0.75rem",
          borderTop: "1px solid rgba(212,175,55,0.15)",
          flexShrink: 0,
        }}>
          <button
            onClick={handleGenerate}
            disabled={!vessel}
            style={{
              width: "100%",
              padding: "0.6rem",
              background: vessel ? "rgba(212,175,55,0.18)" : "rgba(100,116,139,0.1)",
              border: `1px solid ${vessel ? "rgba(212,175,55,0.5)" : "rgba(100,116,139,0.2)"}`,
              borderRadius: "0.5rem",
              color: vessel ? "#D4AF37" : "#475569",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: vessel ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 0.15s",
            }}
          >
            <Download size={14} />
            Générer &amp; Télécharger B/L PDF
          </button>
          <p style={{ fontSize: "0.58rem", color: "#334155", textAlign: "center", marginTop: "0.4rem" }}>
            Conforme FIATA · {form.originalCount} original(s) · Stocké localement
          </p>
        </div>
      )}
    </motion.div>
  );
}
