import { useEffect, useMemo, useState } from "react";
import "../styles/Favoritos.css";
import {
  obtenerFavoritos,
  quitarFavorito,
  obtenerUsuarioActual,
} from "../services/api";

const textoSeguro = (valor) => {
  return String(valor ?? "").toLowerCase();
};

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";

  return new Date(fecha).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function adaptarFavorito(item) {
  const archivo = item.archivo_digital
    ? `http://localhost:3000/${item.archivo_digital}`
    : null;

  return {
    id: item.id_favorito,
    idRecurso: item.id_recurso,
    titulo: item.titulo || "Sin título",
    autor: item.autor || "Autor no registrado",
    categoria: item.categoria || "Sin categoría",
    anio: item.anio_publicacion || "Sin año",
    formato: item.formato || "PDF",
    carrera: item.editorial || "SITEC",
    materia: item.categoria || "Sin materia",
    fechaAgregado: formatearFecha(item.fecha_agregado),
    descripcion:
      item.resumen ||
      "Recurso académico guardado dentro de la biblioteca digital SITEC.",
    estado: "Disponible",
    archivoDigital: archivo,
    urlAcceso: item.url_acceso || null,
    descargaHabilitada: Number(item.descarga_habilitada) === 1,
    visualizacionHabilitada: Number(item.visualizacion_habilitada) === 1,
  };
}

function VistaFavoritos({ usuario }) {
  const usuarioLocal = usuario || obtenerUsuarioActual();

  const idUsuario =
    usuarioLocal?.id_usuario ||
    usuarioLocal?.id ||
    usuarioLocal?.idUsuario ||
    null;

  const nombreUsuario = usuarioLocal?.nombre || "Usuario";

  const [favoritos, setFavoritos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [criterioBusqueda, setCriterioBusqueda] = useState("libro");
  const [orden, setOrden] = useState("recientes");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const placeholderBusqueda = {
    libro: "Buscar por título del libro...",
    autor: "Buscar por nombre del autor...",
    materia: "Buscar por materia...",
  };

  useEffect(() => {
    async function cargarFavoritos() {
      if (!idUsuario) {
        setError("No se encontró el usuario activo.");
        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        setError("");

        const data = await obtenerFavoritos(idUsuario);
        setFavoritos(data.map(adaptarFavorito));
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los favoritos.");
      } finally {
        setCargando(false);
      }
    }

    cargarFavoritos();
  }, [idUsuario]);

  const favoritosFiltrados = useMemo(() => {
  const textoBusqueda = textoSeguro(busqueda.trim());

  let resultado = favoritos.filter((item) => {
    if (!textoBusqueda) return true;

    const campoLibro = textoSeguro(item.titulo);
    const campoAutor = textoSeguro(item.autor);
    const campoMateria = textoSeguro(item.materia || item.categoria);

    if (criterioBusqueda === "libro") {
      return campoLibro.includes(textoBusqueda);
    }

    if (criterioBusqueda === "autor") {
      return campoAutor.includes(textoBusqueda);
    }

    if (criterioBusqueda === "materia") {
      return campoMateria.includes(textoBusqueda);
    }

    return true;
  });

  if (orden === "titulo") {
    resultado = [...resultado].sort((a, b) =>
      String(a.titulo || "").localeCompare(String(b.titulo || ""))
    );
  }

  if (orden === "autor") {
    resultado = [...resultado].sort((a, b) =>
      String(a.autor || "").localeCompare(String(b.autor || ""))
    );
  }

  return resultado;
}, [favoritos, busqueda, criterioBusqueda, orden]);

  const quitarDeFavoritos = async (item) => {
    if (!idUsuario) return;

    try {
      await quitarFavorito(idUsuario, item.idRecurso);

      setFavoritos((prev) =>
        prev.filter((favorito) => favorito.idRecurso !== item.idRecurso)
      );
    } catch (err) {
      console.error(err);
      alert("No se pudo quitar el recurso de favoritos.");
    }
  };
  const verRecurso = (item) => {
  if (!item.visualizacionHabilitada) {
    alert("La visualización de este recurso no está habilitada.");
    return;
  }

  const enlace = item.archivoDigital || item.urlAcceso;

  if (!enlace) {
    alert("Este recurso todavía no tiene archivo digital registrado.");
    return;
  }

  window.open(enlace, "_blank", "noopener,noreferrer");
};

const descargarRecurso = (item) => {
  if (!item.descargaHabilitada) {
    alert("La descarga de este recurso no está habilitada.");
    return;
  }

  const enlace = item.archivoDigital || item.urlAcceso;

  if (!enlace) {
    alert("Este recurso todavía no tiene archivo disponible para descargar.");
    return;
  }

  const link = document.createElement("a");
  link.href = enlace;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.download = `${item.titulo}.${String(item.formato || "pdf").toLowerCase()}`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  if (cargando) {
    return (
      <section className="favoritos-page">
        <div className="favoritos-empty">
          <div className="empty-box"></div>
          <h3>Cargando favoritos</h3>
          <p>Estamos obteniendo tus recursos guardados desde la base de datos.</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="favoritos-page">
        <div className="favoritos-empty">
          <div className="empty-box"></div>
          <h3>No se pudieron cargar los favoritos</h3>
          <p>{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="favoritos-page">
      <div className="favoritos-hero">
        <div className="favoritos-hero-content">
          <span className="hero-eyebrow">Biblioteca personal</span>

          <h1>Mis favoritos</h1>

          <p>
            Hola, <strong>{nombreUsuario}</strong>. En esta sección puedes
            consultar los recursos académicos que guardaste para acceder
            rápidamente a libros, documentos y materiales importantes.
          </p>

          <div className="hero-detail-row">
            <span>Acceso rápido a recursos guardados</span>
            <span>Organización por libro, autor y materia</span>
            <span>Consulta académica personalizada</span>
          </div>
        </div>

        <div className="hero-metric-card">
          <div className="metric-ring">
            <strong>{favoritos.length}</strong>
          </div>
          <h3>Recursos guardados</h3>
          <p>Favoritos disponibles en tu biblioteca personal.</p>
        </div>
      </div>

      <div className="favoritos-estadisticas">
        <div className="fav-stat-card accent-red">
          <div className="fav-stat-icon icon-fav"></div>
          <div className="fav-stat-content">
            <span className="fav-stat-label">Favoritos totales</span>
            <strong>{favoritos.length}</strong>
            <p>Recursos académicos guardados para consulta rápida.</p>
          </div>
        </div>

        <div className="fav-stat-card accent-gold">
          <div className="fav-stat-icon icon-pdf"></div>
          <div className="fav-stat-content">
            <span className="fav-stat-label">Archivos PDF</span>
            <strong>
              {favoritos.filter((item) => item.formato === "PDF").length}
            </strong>
            <p>Material disponible en formato digital listo para consulta.</p>
          </div>
        </div>

        <div className="fav-stat-card accent-blue">
          <div className="fav-stat-icon icon-materia"></div>
          <div className="fav-stat-content">
            <span className="fav-stat-label">Materias relacionadas</span>
            <strong>
              {new Set(favoritos.map((item) => item.materia)).size}
            </strong>
            <p>Áreas académicas vinculadas a tus recursos guardados.</p>
          </div>
        </div>
      </div>

      <div className="favoritos-panel">
        <div className="favoritos-panel-header">
          <div>
            <h2>Recursos favoritos</h2>
            <p>
              Busca y organiza tus recursos guardados por libro, autor o
              materia.
            </p>
          </div>

          <select value={orden} onChange={(e) => setOrden(e.target.value)}>
            <option value="recientes">Ordenar por recientes</option>
            <option value="titulo">Ordenar por título</option>
            <option value="autor">Ordenar por autor</option>
          </select>
        </div>

        <div className="favoritos-toolbar">
          <div className="favoritos-search">
            <span className="search-icon"></span>
            <input
              type="text"
              placeholder={placeholderBusqueda[criterioBusqueda]}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <select
            className="favoritos-select"
            value={criterioBusqueda}
            onChange={(e) => setCriterioBusqueda(e.target.value)}
          >
            <option value="libro">Buscar por libro</option>
            <option value="autor">Buscar por autor</option>
            <option value="materia">Buscar por materia</option>
          </select>
        </div>

        <div className="favoritos-resultados">
  <span>
    {favoritosFiltrados.length === 1
      ? "1 resultado encontrado"
      : `${favoritosFiltrados.length} resultados encontrados`}
  </span>

  {busqueda && (
    <button type="button" onClick={() => setBusqueda("")}>
      Limpiar búsqueda
    </button>
  )}
</div>

        {favoritosFiltrados.length > 0 ? (
          <div className="favoritos-grid">
            {favoritosFiltrados.map((item) => (
              <article className="favorito-card" key={item.idRecurso}>
                <div className="favorito-portada">
                  <div className="favorito-book">
                    <span>{item.formato}</span>
                  </div>
                </div>

                <div className="favorito-info">
                  <div className="favorito-top">
                    <span className="favorito-categoria">
                      {item.categoria}
                    </span>
                    <span className="favorito-estado">{item.estado}</span>
                  </div>

                  <h3>{item.titulo}</h3>

                  <div className="favorito-meta">
                    <span>Autor: {item.autor}</span>
                    <span>Año: {item.anio}</span>
                    <span>Materia: {item.materia}</span>
                  </div>

                  <p>{item.descripcion}</p>

                  <div className="favorito-footer">
                    <span>{item.carrera}</span>
                    <span>Agregado: {item.fechaAgregado}</span>
                  </div>
                </div>

                <div className="favorito-actions">
                 <button
  className="btn-principal"
  type="button"
  onClick={() => verRecurso(item)}
>
  Ver recurso
</button>

<button
  className="btn-secundario"
  type="button"
  onClick={() => descargarRecurso(item)}
>
  Descargar
</button>

<button
  className="btn-quitar"
  type="button"
  onClick={() => {
    const confirmar = window.confirm(
      `¿Deseas quitar "${item.titulo}" de tus favoritos?`
    );

    if (confirmar) {
      quitarDeFavoritos(item);
    }
  }}
>
  Quitar favorito
</button>

                  

                  
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="favoritos-empty">
            <div className="empty-box"></div>
            <h3>No se encontraron recursos</h3>
            <p>
              No existen favoritos que coincidan con la búsqueda actual. Prueba
              buscando por otro libro, autor o materia.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default VistaFavoritos;