import { useState } from "react";
import {
  MessageCircle,
  Send,
  Sparkles,
  BookOpen,
  Heart,
  ExternalLink
} from "lucide-react";
import "../styles/asistenteIA.css";
import botIA from "../assets/bot.png";
const API = "http://localhost:4000/api/asistente";

export default function AsistenteIA() {
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mensajes, setMensajes] = useState([
    {
      tipo: "ia",
      texto: "Hola 👋 Soy el asistente inteligente de SITEC. ¿Qué recurso buscas?"
    }
  ]);

  async function enviarMensaje() {
    if (!mensaje.trim()) return;

    const textoUsuario = mensaje;

    setMensajes(prev => [
      ...prev,
      { tipo: "usuario", texto: textoUsuario }
    ]);

    setMensaje("");

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mensaje: textoUsuario
        })
      });

      const data = await res.json();

      setMensajes(prev => [
        ...prev,
        {
          tipo: "ia",
          texto: data.respuesta,
          recursos: data.recursos || []
        }
      ]);

    } catch (error) {
      setMensajes(prev => [
        ...prev,
        {
          tipo: "ia",
          texto: "Ocurrió un error al conectar con el asistente."
        }
      ]);
    }
  }

  return (
    <>
      {/* BOTÓN FLOTANTE */}
      <button
        className="ia-float-btn"
        onClick={() => setAbierto(!abierto)}
      >
        <img src={botIA} alt="Asistente IA" className="ia-bot-img" />
      </button>

      {/* CHAT */}
      {abierto && (
        <div className="ia-chat">

          {/* HEADER */}
          <div className="ia-header">
            <div className="ia-header-left">
              <div className="ia-icon">
                <img src={botIA} alt="Bot IA" className="ia-header-bot" />
              </div>

              <div>
                <h3>Asistente IA</h3>
                <span>SITEC Biblioteca Inteligente</span>
              </div>
            </div>
          </div>

          {/* MENSAJES */}
          <div className="ia-body">

            {mensajes.map((m, index) => (
              <div
                key={index}
                className={`ia-msg ${m.tipo}`}
              >
                <div className="ia-bubble">
                  {m.texto}

                  {/* RECURSOS */}
                  {m.recursos && m.recursos.length > 0 && (
                    <div className="ia-recursos">

                      {m.recursos.map((r) => (

                        <div className="ia-card" key={r.id_recurso}>

                          <div className="ia-card-icon">
                            <BookOpen size={18} />
                          </div>

                          <div className="ia-card-content">
                            <strong>{r.titulo}</strong>

                            <span>
                              {r.autor || "Autor no registrado"}
                            </span>

                            <div className="ia-card-actions">

                              <button
                                onClick={() => {
  const ruta = r.archivo_digital?.replace(/\\/g, "/").replace(/^\/+/, "");
  window.open(`http://localhost:4000/pdf-proxy?archivo=${encodeURIComponent(ruta)}`, "_blank");
}}
                                
                              >
                                <ExternalLink size={15} />
                                Ver
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* INPUT */}
          <div className="ia-input-wrap">
            <input
              type="text"
              placeholder="Buscar recursos..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") enviarMensaje();
              }}
            />
            <button onClick={enviarMensaje}>
              <Send size={18} />
            </button>

          </div>

        </div>
      )}
    </>
  );
}