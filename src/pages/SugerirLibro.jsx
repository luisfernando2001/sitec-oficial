import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/Sugerirlibro.css";

import BarraSuperior from "../componentes/BarraSuperior";
import BarraLateral from "../componentes/BarraLateral";
import Footer from "../componentes/Footer";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/sitec/api";

function obtenerUsuarioGuardado() {
  try {
    const u = localStorage.getItem("usuario");
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

export default function SugerirLibro() {
  const navigate = useNavigate();

  const usuarioGuardado = obtenerUsuarioGuardado();
  const usuario = usuarioGuardado || {
    nombre: "Usuario", carrera: "Facultad de Tecnología", rol: "Estudiante",
  };
  const idUsuarioSesion = usuario?.id_usuario || usuario?.id || null;
  const rolUsuario      = usuario?.rol || usuario?.nombre_rol || "Estudiante";

  const [step, setStep]               = useState(1);
  const [loading, setLoading]         = useState(false);
  const [toast, setToast]             = useState(null);
  const [errors, setErrors]           = useState({});
  const [submittedData, setSubmittedData] = useState(null);
  const [tabActivo, setTabActivo]     = useState("sugerir");

  // categorías desde BD
  const [categorias, setCategorias]   = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [form, setForm] = useState({
    titulo:          "",
    autor:           "",
    id_categoria:    "",   
    categoria:       "",   
    categoria_otra:  "",   // texto libre cuando eligen "Otra"
    isbn:            "",
    anio:            "",
    enlace:          "",
    descripcion:     "",
    archivo_pdf:     null,
  });

  const timerRef    = useRef(null);
  const pdfInputRef = useRef(null);

  // ── cargar categorías ──
  useEffect(() => {
    fetch(`${API_URL}/categorias`)
      .then(r => r.json())
      .then(data => {
        const lista = Array.isArray(data) ? data : data.categorias || [];
        setCategorias(lista.filter(c => c.estado !== 0));
        setLoadingCats(false);
      })
      .catch(() => setLoadingCats(false));
  }, []);

  const rutaBase = () => {
    const idRol = Number(usuario?.id_rol);
    return (idRol === 2 || rolUsuario === "Docente") ? "/docente" : "/estudiante";
  };

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 3200);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(er => ({ ...er, [name]: "" }));
  }

  // seleccionar categoría desde chip
  function seleccionarCategoria(cat) {
    if (cat === "otra") {
      // toggle "Otra"
      if (form.id_categoria === "otra") {
        setForm(f => ({ ...f, id_categoria: "", categoria: "", categoria_otra: "" }));
      } else {
        setForm(f => ({ ...f, id_categoria: "otra", categoria: "Otra", categoria_otra: "" }));
      }
      return;
    }
    const esaMisma = form.id_categoria === String(cat.id_categoria);
    setForm(f => ({
      ...f,
      id_categoria:   esaMisma ? "" : String(cat.id_categoria),
      categoria:      esaMisma ? "" : cat.nombre_categoria,
      categoria_otra: "",
    }));
  }

  function limpiarCategoria() {
    setForm(f => ({ ...f, id_categoria: "", categoria: "", categoria_otra: "" }));
  }

  // nombre final que se mostrará y enviará
  const categoriaFinal = form.id_categoria === "otra"
    ? (form.categoria_otra.trim() || "Otra")
    : form.categoria;

  function handleArchivoPDF(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) { setForm(f => ({ ...f, archivo_pdf: null })); return; }
    if (archivo.type !== "application/pdf") {
      showToast("Solo se permite subir archivos PDF.", "warn");
      e.target.value = "";
      setForm(f => ({ ...f, archivo_pdf: null }));
      return;
    }
    if (archivo.size > 50 * 1024 * 1024) {
      showToast("El PDF no debe superar los 50 MB.", "warn");
      e.target.value = "";
      setForm(f => ({ ...f, archivo_pdf: null }));
      return;
    }
    setForm(f => ({ ...f, archivo_pdf: archivo }));
    showToast("PDF seleccionado correctamente.", "success");
  }

  function quitarPDF() {
    setForm(f => ({ ...f, archivo_pdf: null }));
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  }

  function formatISBN(v) { return v.replace(/[^0-9-]/g, "").slice(0, 17); }

  function validateStep1() {
    const errs = {};
    if (!form.titulo.trim()) errs.titulo = "El título es requerido";
    if (!form.autor.trim())  errs.autor  = "El autor es requerido";
    if (Object.keys(errs).length) {
      setErrors(errs);
      showToast("Completa los campos requeridos", "warn");
      return false;
    }
    return true;
  }

  function nextStep() {
    if (step === 1) { if (!validateStep1()) return; setStep(2); return; }
    if (step === 2) submitForm();
  }

  async function submitForm() {
    if (!idUsuarioSesion) {
      showToast("No se encontró el usuario. Vuelve a iniciar sesión.", "error");
      return;
    }
    if (!form.archivo_pdf && !form.enlace.trim()) {
      showToast("Debes subir un PDF o colocar un enlace del recurso.", "warn");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("id_usuario",       idUsuarioSesion);
      fd.append("titulo",           form.titulo.trim());
      fd.append("autor",            form.autor.trim());
      fd.append("categoria",        categoriaFinal);
      fd.append("id_categoria",     form.id_categoria === "otra" ? "" : (form.id_categoria || ""));
      fd.append("isbn",             form.isbn || "");
      fd.append("anio_publicacion", form.anio || "");
      fd.append("url_acceso",       form.enlace || "");
      fd.append("resumen",          form.descripcion || "");
      fd.append("observacion",      form.descripcion || "");
      fd.append("formato",          "PDF");
      fd.append("tipo",             "Libro digital");
      fd.append("idioma",           "Español");
      if (form.archivo_pdf) fd.append("archivo_pdf", form.archivo_pdf);

      const res    = await fetch(`${API_URL}/solicitudes`, { method: "POST", body: fd });
      const texto  = await res.text();
      let data = {};
      try { data = texto ? JSON.parse(texto) : {}; } catch { data = {}; }
      if (!res.ok) throw new Error(data.mensaje || data.error || texto || `Error HTTP ${res.status}`);

      setSubmittedData({
        titulo:             form.titulo.trim(),
        autor:              form.autor.trim(),
        categoria:          categoriaFinal,
        isbn:               form.isbn || "",
        url_acceso:         form.enlace || "",
        archivo_pdf_nombre: form.archivo_pdf?.name || "",
        id_solicitud:       data.id_solicitud,
      });
      setStep(3);
      showToast("Solicitud registrada correctamente", "success");

    } catch (err) {
      showToast(`Error al enviar: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      titulo: "", autor: "", id_categoria: "", categoria: "", categoria_otra: "",
      isbn: "", anio: "", enlace: "", descripcion: "", archivo_pdf: null,
    });
    if (pdfInputRef.current) pdfInputRef.current.value = "";
    setErrors({});
    setStep(1);
    setSubmittedData(null);
  }

  const stepClass  = n => n < step ? "step-circle done"  : n === step ? "step-circle active"  : "step-circle";
  const labelClass = n => n < step ? "step-label done"   : n === step ? "step-label active"   : "step-label";
  const lineClass  = n => "step-line" + (n < step ? " done" : "");

  const toastIcons = { success: "✓", warn: "!", error: "×", info: "i" };

  return (
    <div className="sitec-wrap">
      <BarraSuperior rol={rolUsuario} usuario={usuario} setTabActivo={setTabActivo} />

      <div className="sitec-body">
        <BarraLateral tabActivo={tabActivo} setTabActivo={setTabActivo} rol={rolUsuario} />

        <main className="sitec-content">
          <div className="sl-page">

            {/* Breadcrumb */}
            <div className="breadcrumb">
              <button type="button" className="btn-back"
                onClick={() => navigate(rutaBase(), { state: { tab: "solicitudes" } })}>
                Volver
              </button>
              <span className="bc-sep">›</span>
              <span className="bc-text">
                Inicio <span style={{ color: "var(--muted)" }}>›</span>{" "}
                <span>Sugerir un Recurso</span>
              </span>
            </div>

            <div className="form-card">

              {/* Header */}
              <div className="form-card-top">
                <div className="top-blob tb1" /><div className="top-blob tb2" />
                <div className="fct-inner">
                  <div className="fct-icon">💡</div>
                  <div className="fct-text">
                    <div className="fct-eyebrow">Contribuye al conocimiento</div>
                    <div className="fct-title">Sugerir un Recurso</div>
                    <div className="fct-sub">
                      Sugiere un material académico subiendo el PDF o colocando un enlace.
                      El administrador lo revisará antes de publicarlo.
                    </div>
                  </div>
                </div>
              </div>

              {/* Stepper */}
              <div className="stepper">
                <div className="step">
                  <div className={stepClass(1)}>{step > 1 ? "✓" : "1"}</div>
                  <div className={labelClass(1)}>Datos del recurso</div>
                </div>
                <div className={lineClass(1)} />
                <div className="step">
                  <div className={stepClass(2)}>{step > 2 ? "✓" : "2"}</div>
                  <div className={labelClass(2)}>Archivo o enlace</div>
                </div>
                <div className={lineClass(2)} />
                <div className="step">
                  <div className={stepClass(3)}>✓</div>
                  <div className={labelClass(3)}>Confirmación</div>
                </div>
              </div>

              {/* ── STEP 1 ── */}
              {step === 1 && (
                <div className="form-body">
                  <div className="field-section-title">Datos principales del recurso</div>

                  <div className="fields-grid">

                    <div className="fg field-full">
                      <label>Título del Recurso <span className="req">*</span></label>
                      <div className="iw">
                        <span className="ico"></span>
                        <input type="text" name="titulo" value={form.titulo}
                          onChange={handleChange}
                          placeholder="Ej: Ingeniería de Software de Pressman"
                          maxLength={120} className={errors.titulo ? "err" : ""} />
                      </div>
                      <div className={`char-counter${form.titulo.length > 108 ? " warn" : ""}`}>
                        {form.titulo.length} / 120
                      </div>
                      {errors.titulo && <div className="field-err show">{errors.titulo}</div>}
                    </div>

                    <div className="fg field-full">
                      <label>Autor <span className="req">*</span></label>
                      <div className="iw">
                        <span className="ico"></span>
                        <input type="text" name="autor" value={form.autor}
                          onChange={handleChange}
                          placeholder="Nombre completo del autor o autores"
                          maxLength={80} className={errors.autor ? "err" : ""} />
                      </div>
                      {errors.autor && <div className="field-err show">{errors.autor}</div>}
                    </div>

                    {/* ── CATEGORÍA DROPDOWN ── */}
<div className="fg field-full">
  <label>
    Categoría{" "}
    <span className="opt-badge">Opcional</span>
  </label>

  <div className="iw">
    <span className="ico">🏷️</span>
    {loadingCats ? (
      <select disabled>
        <option>Cargando categorías...</option>
      </select>
    ) : (
      <select
        name="id_categoria"
        value={form.id_categoria}
        onChange={e => {
          const val = e.target.value;
          if (val === "") {
            setForm(f => ({ ...f, id_categoria: "", categoria: "", categoria_otra: "" }));
          } else if (val === "otra") {
            setForm(f => ({ ...f, id_categoria: "otra", categoria: "Otra", categoria_otra: "" }));
          } else {
            const cat = categorias.find(c => String(c.id_categoria) === val);
            setForm(f => ({
              ...f,
              id_categoria: val,
              categoria: cat?.nombre_categoria || "",
              categoria_otra: "",
            }));
          }
          setErrors(er => ({ ...er, id_categoria: "" }));
        }}
      >
        <option value="">— Selecciona una categoría —</option>
        {categorias.map(cat => (
          <option key={cat.id_categoria} value={String(cat.id_categoria)}>
            {cat.codigo ? `[${cat.codigo}] ` : ""}{cat.nombre_categoria}
          </option>
        ))}
        <option value="otra">✏️ Otra (especificar)</option>
      </select>
    )}
  </div>

  {/* campo libre cuando eligen "Otra" */}
  {form.id_categoria === "otra" && (
    <div className="cat-otra-wrap">
      <div className="iw">
        <span className="ico">✏️</span>
        <input
          type="text"
          name="categoria_otra"
          value={form.categoria_otra}
          onChange={handleChange}
          placeholder="Escribe el nombre de la categoría..."
          maxLength={80}
          autoFocus
        />
      </div>
      <div className="field-hint">
        El administrador la revisará y la asignará correctamente.
      </div>
    </div>
  )}
</div>

                  </div>
                </div>
              )}

              {/* ── STEP 2 ── */}
              {step === 2 && (
                <div className="form-body">
                  <div className="field-section-title">Información adicional y archivo</div>

                  <div className="fields-grid">

                    <div className="fg">
                      <label>ISBN <span className="opt-badge">Opcional</span></label>
                      <div className="iw">
                        <span className="ico">🔢</span>
                        <input type="text" name="isbn" value={form.isbn}
                          onChange={e => setForm(f => ({ ...f, isbn: formatISBN(e.target.value) }))}
                          placeholder="978-XXXXXXXXXX" maxLength={17} />
                      </div>
                      <div className="field-hint">Formato: 978-0-000-00000-0</div>
                    </div>

                    <div className="fg">
                      <label>Año de Publicación <span className="opt-badge">Opcional</span></label>
                      <div className="iw">
                        <span className="ico">📅</span>
                        <input type="text" name="anio" value={form.anio}
                          onChange={e => setForm(f => ({
                            ...f, anio: e.target.value.replace(/\D/g,"").slice(0,4)
                          }))}
                          placeholder="Ej: 2023" maxLength={4} />
                      </div>
                    </div>

                    <div className="fg field-full">
                      <label>Subir PDF <span className="opt-badge">Opcional</span></label>
                      <div className="iw">
                        <span className="ico">📄</span>
                        <input ref={pdfInputRef} type="file"
                          accept="application/pdf" onChange={handleArchivoPDF} />
                      </div>
                      <div className="field-hint">
                        Puedes subir el PDF del recurso. Si no lo tienes, coloca un enlace.
                      </div>
                      {form.archivo_pdf && (
                        <div className="field-hint">
                          Archivo: <strong>{form.archivo_pdf.name}</strong>
                          <button type="button" className="cat-chip-sel"
                            style={{ marginLeft: 10 }} onClick={quitarPDF}>
                            Quitar PDF
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="fg field-full">
                      <label>Enlace de Referencia <span className="opt-badge">Opcional</span></label>
                      <div className="iw">
                        <span className="ico">🔗</span>
                        <input type="url" name="enlace" value={form.enlace}
                          onChange={handleChange} placeholder="https://ejemplo.com/recurso" />
                      </div>
                      <div className="field-hint">
                        Si no tienes el PDF, coloca un enlace donde se pueda encontrar el recurso.
                      </div>
                    </div>

                    <div className="fg field-full">
                      <label>
                        ¿Por qué sugieres este recurso?{" "}
                        <span className="opt-badge">Opcional</span>
                      </label>
                      <div className="iw textarea-wrap">
                        <span className="ico">💬</span>
                        <textarea name="descripcion" value={form.descripcion}
                          onChange={handleChange}
                          placeholder="Cuéntanos por qué este recurso sería útil para la biblioteca..."
                          maxLength={400} />
                      </div>
                      <div className={`char-counter${form.descripcion.length > 360 ? " warn" : ""}`}>
                        {form.descripcion.length} / 400
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* ── SUCCESS ── */}
              {step === 3 && submittedData && (
                <div className="success-screen">
                  <div className="success-ring">✓</div>
                  <div className="success-title">¡Solicitud enviada!</div>
                  <div className="success-sub">
                    Tu solicitud fue registrada con estado{" "}
                    <strong>Pendiente</strong>. El administrador la revisará
                    antes de publicarla en el catálogo.
                  </div>
                  <div className="success-detail">
                    <div className="sd-row">
                      <span className="sd-lbl">Recurso</span>
                      <span className="sd-val sd-truncate">{submittedData.titulo}</span>
                    </div>
                    <div className="sd-row">
                      <span className="sd-lbl">Autor</span>
                      <span className="sd-val">{submittedData.autor}</span>
                    </div>
                    <div className="sd-row">
                      <span className="sd-lbl">Categoría</span>
                      <span className="sd-val">{submittedData.categoria || "Sin categoría"}</span>
                    </div>
                    <div className="sd-row">
                      <span className="sd-lbl">Archivo PDF</span>
                      <span className="sd-val">{submittedData.archivo_pdf_nombre || "No se adjuntó PDF"}</span>
                    </div>
                    <div className="sd-row">
                      <span className="sd-lbl">Enlace</span>
                      <span className="sd-val sd-truncate">{submittedData.url_acceso || "Sin enlace"}</span>
                    </div>
                    <div className="sd-row">
                      <span className="sd-lbl">Estado</span>
                      <span className="sd-status">Pendiente de revisión</span>
                    </div>
                  </div>
                  <div className="success-actions">
                    <button type="button" className="btn-go btn-go-prim"
                      onClick={() => navigate(rutaBase(), { state: { tab: "solicitudes" } })}>
                      Ver Mis Solicitudes
                    </button>
                    <button type="button" className="btn-go btn-go-sec" onClick={resetForm}>
                      Sugerir otro recurso
                    </button>
                  </div>
                </div>
              )}

              {/* Acciones */}
              {step !== 3 && (
                <div className="form-actions">
                  <button type="button" className="btn-submit"
                    onClick={nextStep} disabled={loading}>
                    {loading ? "Enviando..." : step === 1 ? "Continuar" : "Enviar Solicitud"}
                  </button>
                  <button type="button" className="btn-cancel"
                    onClick={() => navigate(rutaBase(), { state: { tab: "solicitudes" } })}>
                    Cancelar
                  </button>
                </div>
              )}

            </div>
          </div>

          <Footer />
        </main>
      </div>

      {toast && (
        <div className="toast show">
          <span>{toastIcons[toast.type] || "✓"}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}