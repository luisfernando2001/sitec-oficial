import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Footer.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const footerDefault = {
  titulo: "SITEC",
  descripcion:
    "Sistema Integrado de Tecnología y Conocimiento de la Facultad de Tecnología. Accede, comparte y gestiona recursos académicos de manera eficiente.",
  badge1: "UMSA",
  badge2: "Fac. Tecnología",

  tituloRecursos: "Recursos",
  mostrarCatalogo: true,
  mostrarFavoritos: true,
  mostrarHistorial: true,
  mostrarSugerir: true,

  tituloCuenta: "Mi Cuenta",
  mostrarPerfil: true,
  mostrarSolicitudes: true,
  mostrarConfiguracion: true,
  mostrarCerrarSesion: true,

  tituloContacto: "Contacto",
  direccion: "Av. Villazón esq. Calle 27, La Paz, Bolivia",
  correo: "sitec@umsa.bo",
  horario: "Lun – Vie, 08:00 – 18:00",
  telefono: "(+591-2) 244-0565",

  copyright: "SITEC – Facultad de Tecnología",
  mostrarFacebook: true,
  mostrarInstagram: true,
  mostrarYoutube: true,
  mostrarWhatsapp: true,
};

function convertirBooleano(valor, defecto = true) {
  if (valor === undefined || valor === null || valor === "") return defecto;

  if (typeof valor === "boolean") return valor;

  const texto = String(valor).toLowerCase();

  return texto === "1" || texto === "true" || texto === "si" || texto === "sí";
}

function normalizarFooter(data) {
  const fuente =
    data?.footer ||
    data?.configuracion ||
    data?.datos ||
    data ||
    {};

  return {
    ...footerDefault,

    titulo: fuente.footer_titulo || fuente.titulo || footerDefault.titulo,
    descripcion:
      fuente.footer_descripcion ||
      fuente.descripcion ||
      footerDefault.descripcion,

    badge1: fuente.footer_badge_1 || fuente.badge1 || footerDefault.badge1,
    badge2: fuente.footer_badge_2 || fuente.badge2 || footerDefault.badge2,

    tituloRecursos:
      fuente.footer_titulo_recursos ||
      fuente.tituloRecursos ||
      footerDefault.tituloRecursos,

    mostrarCatalogo: convertirBooleano(
      fuente.footer_mostrar_catalogo ?? fuente.mostrarCatalogo,
      footerDefault.mostrarCatalogo
    ),

    mostrarFavoritos: convertirBooleano(
      fuente.footer_mostrar_favoritos ?? fuente.mostrarFavoritos,
      footerDefault.mostrarFavoritos
    ),

    mostrarHistorial: convertirBooleano(
      fuente.footer_mostrar_historial ?? fuente.mostrarHistorial,
      footerDefault.mostrarHistorial
    ),

    mostrarSugerir: convertirBooleano(
      fuente.footer_mostrar_sugerir ?? fuente.mostrarSugerir,
      footerDefault.mostrarSugerir
    ),

    tituloCuenta:
      fuente.footer_titulo_cuenta ||
      fuente.tituloCuenta ||
      footerDefault.tituloCuenta,

    mostrarPerfil: convertirBooleano(
      fuente.footer_mostrar_perfil ?? fuente.mostrarPerfil,
      footerDefault.mostrarPerfil
    ),

    mostrarSolicitudes: convertirBooleano(
      fuente.footer_mostrar_solicitudes ?? fuente.mostrarSolicitudes,
      footerDefault.mostrarSolicitudes
    ),

    mostrarConfiguracion: convertirBooleano(
      fuente.footer_mostrar_configuracion ?? fuente.mostrarConfiguracion,
      footerDefault.mostrarConfiguracion
    ),

    mostrarCerrarSesion: convertirBooleano(
      fuente.footer_mostrar_cerrar_sesion ?? fuente.mostrarCerrarSesion,
      footerDefault.mostrarCerrarSesion
    ),

    tituloContacto:
      fuente.footer_titulo_contacto ||
      fuente.tituloContacto ||
      footerDefault.tituloContacto,

    direccion:
      fuente.footer_direccion ||
      fuente.direccion ||
      footerDefault.direccion,

    correo:
      fuente.footer_correo ||
      fuente.correo ||
      footerDefault.correo,

    horario:
      fuente.footer_horario ||
      fuente.horario ||
      footerDefault.horario,

    telefono:
      fuente.footer_telefono ||
      fuente.telefono ||
      footerDefault.telefono,

    copyright:
      fuente.footer_copyright ||
      fuente.copyright ||
      footerDefault.copyright,

    mostrarFacebook: convertirBooleano(
      fuente.footer_mostrar_facebook ?? fuente.mostrarFacebook,
      footerDefault.mostrarFacebook
    ),

    mostrarInstagram: convertirBooleano(
      fuente.footer_mostrar_instagram ?? fuente.mostrarInstagram,
      footerDefault.mostrarInstagram
    ),

    mostrarYoutube: convertirBooleano(
      fuente.footer_mostrar_youtube ?? fuente.mostrarYoutube,
      footerDefault.mostrarYoutube
    ),

    mostrarWhatsapp: convertirBooleano(
      fuente.footer_mostrar_whatsapp ?? fuente.mostrarWhatsapp,
      footerDefault.mostrarWhatsapp
    ),
  };
}

export default function Footer() {
  const year = new Date().getFullYear();
  const navigate = useNavigate();

  const [footer, setFooter] = useState(footerDefault);

  useEffect(() => {
    async function cargarFooter() {
      try {
        const respuesta = await fetch(`${API_URL}/admin/configuracion/footer`);

        if (!respuesta.ok) {
          return;
        }

        const data = await respuesta.json();

        setFooter(normalizarFooter(data));
      } catch {
        setFooter(footerDefault);
      }
    }

    cargarFooter();
  }, []);

  const irA = (ruta) => {
    navigate(ruta);
  };

  const cerrarSesion = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">

          {/* Columna: Marca */}
          <div className="footer-brand">
            <div className="footer-logo-row">
              <div className="footer-logo-title">
                {footer.titulo.slice(0, 2)}
                <em>{footer.titulo.slice(2)}</em>
              </div>
            </div>

            <p className="footer-desc">
              {footer.descripcion}
            </p>

            <div className="footer-badges">
              {footer.badge1 && (
                <span className="footer-badge fb-vino">
                  {footer.badge1}
                </span>
              )}

              {footer.badge2 && (
                <span className="footer-badge fb-dora">
                  {footer.badge2}
                </span>
              )}
            </div>
          </div>

          {/* Columna: Recursos */}
          <div>
            <div className="footer-col-title">
              {footer.tituloRecursos}
            </div>

            <ul className="footer-links">
              {footer.mostrarCatalogo && (
                <li>
                  <button onClick={() => irA("/catalogo")}>
                    📚 Catálogo
                  </button>
                </li>
              )}

              {footer.mostrarFavoritos && (
                <li>
                  <button onClick={() => irA("/favoritos")}>
                    ⭐ Favoritos
                  </button>
                </li>
              )}

              {footer.mostrarHistorial && (
                <li>
                  <button onClick={() => irA("/historial")}>
                    🕐 Historial de descargas
                  </button>
                </li>
              )}

              {footer.mostrarSugerir && (
                <li>
                  <button onClick={() => irA("/sugerir-libro")}>
                    💡 Sugerir un libro
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Columna: Mi Cuenta */}
          <div>
            <div className="footer-col-title">
              {footer.tituloCuenta}
            </div>

            <ul className="footer-links">
              {footer.mostrarPerfil && (
                <li>
                  <button onClick={() => irA("/perfil")}>
                    👤 Mi Perfil
                  </button>
                </li>
              )}

              {footer.mostrarSolicitudes && (
                <li>
                  <button onClick={() => irA("/mis-solicitudes")}>
                    📋 Mis Solicitudes
                  </button>
                </li>
              )}

              {footer.mostrarConfiguracion && (
                <li>
                  <button onClick={() => irA("/configuracion")}>
                    ⚙️ Configuración
                  </button>
                </li>
              )}

              {footer.mostrarCerrarSesion && (
                <li>
                  <button onClick={cerrarSesion}>
                    ⏻ Cerrar sesión
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Columna: Contacto */}
          <div>
            <div className="footer-col-title">
              {footer.tituloContacto}
            </div>

            {footer.direccion && (
              <div className="footer-contact-item">
                <span className="fc-ico">📍</span>
                <span className="fc-text">{footer.direccion}</span>
              </div>
            )}

            {footer.correo && (
              <div className="footer-contact-item">
                <span className="fc-ico">📧</span>
                <span className="fc-text">{footer.correo}</span>
              </div>
            )}

            {footer.horario && (
              <div className="footer-contact-item">
                <span className="fc-ico">🕐</span>
                <span className="fc-text">{footer.horario}</span>
              </div>
            )}

            {footer.telefono && (
              <div className="footer-contact-item">
                <span className="fc-ico">📞</span>
                <span className="fc-text">{footer.telefono}</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p className="footer-copy">
          © {year} <strong>{footer.copyright}</strong>. Todos los derechos reservados.
        </p>

        <div className="footer-socials">
          {footer.mostrarFacebook && (
            <a className="footer-social-btn" href="#" title="Facebook">
              📘
            </a>
          )}

          {footer.mostrarInstagram && (
            <a className="footer-social-btn" href="#" title="Instagram">
              📸
            </a>
          )}

          {footer.mostrarYoutube && (
            <a className="footer-social-btn" href="#" title="YouTube">
              ▶️
            </a>
          )}

          {footer.mostrarWhatsapp && (
            <a className="footer-social-btn" href="#" title="WhatsApp">
              💬
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}