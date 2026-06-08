import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./login.css";

import logoUMSA from "../assets/logo_umsa.png";
import logoTec from "../assets/logo_tecnologia.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function generarCodigoCaptcha() {
  /*
    Se eliminan letras confusas:
    I, L, O, 0, 1
  */
  const caracteres = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let codigo = "";

  for (let i = 0; i < 4; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }

  return codigo;
}

function Login() {
  const navigate = useNavigate();

  const [vista, setVista] = useState("login");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const [captchaCodigo, setCaptchaCodigo] = useState(() => generarCodigoCaptcha());
  const [captchaTexto, setCaptchaTexto] = useState("");

  const [usuarioPendiente, setUsuarioPendiente] = useState(null);
  const [tokenPendiente, setTokenPendiente] = useState("");

  const [loginForm, setLoginForm] = useState({
    correo: "",
    password: "",
  });

  const [registroForm, setRegistroForm] = useState({
    nombres: "",
    apellidos: "",
    correo: "",
    carnet: "",
    registroUniversitario: "",
  });

  const [resetForm, setResetForm] = useState({
    correo: "",
    carnet: "",
    registroUniversitario: "",
  });

  const [cambioPasswordForm, setCambioPasswordForm] = useState({
    nuevaPassword: "",
    confirmarPassword: "",
  });

  const refrescarCaptcha = () => {
    setCaptchaCodigo(generarCodigoCaptcha());
    setCaptchaTexto("");
  };

  const cambiarVista = (nuevaVista) => {
    setCaptchaCodigo(generarCodigoCaptcha());
    setCaptchaTexto("");
    setVista(nuevaVista);
  };

  const esCorreoInstitucional = (correo) => {
    return correo.trim().toLowerCase().endsWith("@umsa.bo");
  };
  const DOMINIO_UMSA = "@umsa.bo";

const normalizarCorreoInstitucional = (valor) => {
  const correo = String(valor || "")
    .trim()
    .toLowerCase()
    .replace(/\s/g, "");

  if (!correo) return "";

  if (correo.includes("@")) {
    return correo;
  }

  return `${correo}${DOMINIO_UMSA}`;
};

const limpiarUsuarioCorreo = (valor) => {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .replace(/\s/g, "")
    .replace("@umsa.bo", "")
    .replace(/@.*$/, "");
};

const validarPasswordSegura = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,8}$/;
  return regex.test(password);
};

const obtenerReglasPassword = (password) => {
  return {
    longitud: password.length >= 6 && password.length <= 8,
    mayuscula: /[A-Z]/.test(password),
    minuscula: /[a-z]/.test(password),
    numero: /\d/.test(password),
  };
};
  const validarCaptcha = () => {
    if (!captchaTexto.trim()) {
      alert("Ingresa el código de seguridad");
      return false;
    }

    if (captchaTexto.trim().toUpperCase() !== captchaCodigo.toUpperCase()) {
      alert("El código de seguridad no coincide");
      refrescarCaptcha();
      return false;
    }

    return true;
  };

  const obtenerTextoRol = (usuario) => {
    return (
      usuario?.rol ||
      usuario?.nombre_rol ||
      usuario?.tipo_usuario ||
      ""
    ).toLowerCase();
  };

  const esEstudiante = (usuario) => {
    const idRol = Number(usuario?.id_rol);
    const rolTexto = obtenerTextoRol(usuario);

    return idRol === 3 || rolTexto.includes("estudiante");
  };

 const obtenerRutaPorRol = (usuario) => {
  const idRol = Number(usuario?.id_rol);
  const rolTexto = obtenerTextoRol(usuario);

  if (idRol === 1 || rolTexto.includes("administrador")) {
    return "/admin";
  }

  if (idRol === 4 || rolTexto.includes("gestor")) {
    return "/gestor";
  }

  if (idRol === 2 || rolTexto.includes("docente")) {
    return "/docente";
  }

  if (idRol === 3 || rolTexto.includes("estudiante")) {
    return "/estudiante";
  }

  return "/estudiante";
};

  const guardarSesion = (usuario, token) => {
    localStorage.setItem("usuario", JSON.stringify(usuario));

    if (token) {
      localStorage.setItem("token", token);
    }

    if (remember) {
      localStorage.setItem("recordarSesion", "true");
    } else {
      localStorage.removeItem("recordarSesion");
    }
  };

  const iniciarSesion = async (e) => {
    e.preventDefault();

    const correo = normalizarCorreoInstitucional(loginForm.correo);
    const password = loginForm.password.trim();

    if (!correo) {
      alert("Ingresa tu correo institucional");
      return;
    }

    if (!esCorreoInstitucional(correo)) {
      alert("Solo se permite correo institucional @umsa.bo");
      return;
    }

    if (!password) {
      alert("Ingresa tu contraseña");
      return;
    }

    if (!validarCaptcha()) return;

    try {
      setLoading(true);

      const respuesta = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo,
          password,
        }),
      });

      const data = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok || data.ok === false) {
        alert(data.message || data.error || "Correo o contraseña incorrectos");
        refrescarCaptcha();
        return;
      }

      const usuario = data.usuario || data.user || {};
      const token = data.token || "";

      const usuarioConRolDetectado = {
        ...usuario,
        rolDetectado:
          usuario?.rol ||
          usuario?.nombre_rol ||
          usuario?.tipo_usuario ||
          "No definido",
      };

      const carnetUsuario = String(
        usuario?.carnet ||
          usuario?.ci ||
          usuario?.carnet_identidad ||
          ""
      ).trim();

      const debeCambiarPassword =
        data.debe_cambiar_password === true ||
        data.debeCambiarPassword === true ||
        data.debe_cambiar_password === 1 ||
        data.debeCambiarPassword === 1 ||
        usuario?.debe_cambiar_password === 1 ||
        usuario?.debe_cambiar_password === true ||
        usuario?.password_temporal === 1 ||
        usuario?.password_temporal === true ||
        (
          esEstudiante(usuarioConRolDetectado) &&
          carnetUsuario &&
          password === carnetUsuario
        );

      if (debeCambiarPassword) {
        setUsuarioPendiente(usuarioConRolDetectado);
        setTokenPendiente(token);

        setCambioPasswordForm({
          nuevaPassword: "",
          confirmarPassword: "",
        });

        cambiarVista("cambiar-password");
        return;
      }

      guardarSesion(usuarioConRolDetectado, token);

      const rutaDestino = data.ruta || obtenerRutaPorRol(usuarioConRolDetectado);

      navigate(rutaDestino);
    } catch (error) {
      console.error("Error en iniciar sesión:", error);
      alert("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const crearCuenta = async (e) => {
    e.preventDefault();

    const nombres = registroForm.nombres.trim();
    const apellidos = registroForm.apellidos.trim();
const correo = normalizarCorreoInstitucional(registroForm.correo);
    const carnet = registroForm.carnet.trim();
    const registroUniversitario = registroForm.registroUniversitario.trim();

    if (!nombres || !apellidos || !correo || !carnet || !registroUniversitario) {
      alert("Completa todos los campos");
      return;
    }

    if (!esCorreoInstitucional(correo)) {
      alert("Solo se permite crear cuenta con correo institucional @umsa.bo");
      return;
    }

    if (!validarCaptcha()) return;

    try {
      setLoading(true);

      const respuesta = await fetch(`${API_URL}/auth/registro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombres,
          apellidos,
          correo,
          carnet,
          registro_universitario: registroUniversitario,
          password: carnet,
        }),
      });

      const data = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok || data.ok === false) {
        alert(data.message || data.error || "No se pudo crear la cuenta");
        refrescarCaptcha();
        return;
      }

      alert("Cuenta creada correctamente. La contraseña inicial es tu carnet.");

      setRegistroForm({
        nombres: "",
        apellidos: "",
        correo: "",
        carnet: "",
        registroUniversitario: "",
      });

      setLoginForm({
        correo: limpiarUsuarioCorreo(correo),
        password: "",
      });

      cambiarVista("login");
    } catch (error) {
      console.error("Error al crear cuenta:", error);
      alert("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const resetearPassword = async (e) => {
    e.preventDefault();

const correo = normalizarCorreoInstitucional(resetForm.correo);
    const carnet = resetForm.carnet.trim();
    const registroUniversitario = resetForm.registroUniversitario.trim();

    if (!correo || !carnet || !registroUniversitario) {
      alert("Completa todos los datos solicitados");
      return;
    }

    if (!esCorreoInstitucional(correo)) {
      alert("El correo debe ser institucional @umsa.bo");
      return;
    }

    if (!validarCaptcha()) return;

    try {
      setLoading(true);

      const respuesta = await fetch(`${API_URL}/auth/reset-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo,
          carnet,
          registro_universitario: registroUniversitario,
        }),
      });

      const data = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok || data.ok === false) {
        alert(data.message || data.error || "No se pudo resetear la contraseña");
        refrescarCaptcha();
        return;
      }

      alert("Contraseña reseteada correctamente. La nueva contraseña es tu carnet.");

      setResetForm({
        correo: "",
        carnet: "",
        registroUniversitario: "",
      });

setLoginForm({
  correo: limpiarUsuarioCorreo(correo),
  password: "",
});

      cambiarVista("login");
    } catch (error) {
      console.error("Error al resetear contraseña:", error);
      alert("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const cambiarPasswordInicial = async (e) => {
    e.preventDefault();

    const nuevaPassword = cambioPasswordForm.nuevaPassword.trim();
    const confirmarPassword = cambioPasswordForm.confirmarPassword.trim();

    const carnetUsuario = String(
      usuarioPendiente?.carnet ||
        usuarioPendiente?.ci ||
        usuarioPendiente?.carnet_identidad ||
        ""
    ).trim();

    if (!nuevaPassword || !confirmarPassword) {
      alert("Completa la nueva contraseña");
      return;
    }

if (!validarPasswordSegura(nuevaPassword)) {
  alert(
    "La nueva contraseña debe tener de 6 a 8 caracteres, incluir una mayúscula, una minúscula y un número."
  );
  return;
}

    if (nuevaPassword !== confirmarPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    if (carnetUsuario && nuevaPassword === carnetUsuario) {
      alert("La nueva contraseña no puede ser igual a tu carnet");
      return;
    }

    try {
      setLoading(true);

      const respuesta = await fetch(`${API_URL}/auth/cambiar-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(tokenPendiente ? { Authorization: `Bearer ${tokenPendiente}` } : {}),
        },
        body: JSON.stringify({
          id_usuario: usuarioPendiente?.id_usuario || usuarioPendiente?.id,
          correo: usuarioPendiente?.correo,
          nueva_password: nuevaPassword,
        }),
      });

      const data = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok || data.ok === false) {
        alert(data.message || data.error || "No se pudo cambiar la contraseña");
        return;
      }

      alert("Contraseña actualizada correctamente");

      const usuarioActualizado = {
        ...usuarioPendiente,
        debe_cambiar_password: 0,
        password_temporal: 0,
      };

      guardarSesion(usuarioActualizado, tokenPendiente);

      setUsuarioPendiente(null);
      setTokenPendiente("");

      setCambioPasswordForm({
        nuevaPassword: "",
        confirmarPassword: "",
      });

      navigate(data.ruta || obtenerRutaPorRol(usuarioActualizado));
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      alert("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };
  const reglasPassword = obtenerReglasPassword(
    cambioPasswordForm.nuevaPassword
  );
  return (
    <div className="sitec-login">
      <section className="sitec-left">
        <div className="sitec-logos">
          <div className="sitec-logo-box">
            <img src={logoUMSA} alt="UMSA" />
          </div>

          <div className="sitec-logo-divider" />

          <div className="sitec-logo-box">
            <img src={logoTec} alt="Facultad de Tecnología" />
          </div>
        </div>

        <div className="sitec-brand">
          <div className="sitec-brand-name">SITEC</div>

          <div className="sitec-brand-full">
            Sistema de Información Tecnológica Educativa Central
          </div>

          <p className="sitec-brand-desc">
            Biblioteca digital institucional para la Facultad de Tecnología.
          </p>
        </div>

        <ul className="sitec-features">
          <li>Acceso con correo institucional</li>
          <li>Detección automática de rol</li>
          <li>Recursos organizados por carrera y materia</li>
          <li>Gestión segura de usuarios</li>
        </ul>
      </section>

      <section className="sitec-right">
        <div className="sitec-form-wrap">
          {vista !== "cambiar-password" && (
            <div className="sitec-tabs">
              <button
                type="button"
                className={vista === "login" ? "active" : ""}
                onClick={() => cambiarVista("login")}
              >
                Iniciar sesión
              </button>

              <button
                type="button"
                className={vista === "registro" ? "active" : ""}
                onClick={() => cambiarVista("registro")}
              >
                Crear cuenta
              </button>
            </div>
          )}

          {vista === "login" && (
            <form onSubmit={iniciarSesion} noValidate>
              <div className="sitec-welcome">Bienvenido</div>

              <h1 className="sitec-title">Iniciar Sesión</h1>

              <p className="sitec-subtitle-text">
                El sistema detectará automáticamente si eres estudiante, docente o administrador.
              </p>

              <label className="sitec-label">Correo institucional</label>
              <div className="sitec-field">
                <div className="sitec-input-wrap">
                  <span className="sitec-input-icon">@</span>
<div className="sitec-email-control">
  <input
    type="text"
    placeholder="lflarico"
    value={loginForm.correo}
    onChange={(e) =>
      setLoginForm({
        ...loginForm,
        correo: limpiarUsuarioCorreo(e.target.value),
      })
    }
  />

  <span className="sitec-email-domain">
    @umsa.bo
  </span>
</div>
                </div>
              </div>

              <label className="sitec-label">Contraseña</label>
              <div className="sitec-field">
                <div className="sitec-input-wrap">
                  <span className="sitec-input-icon">••</span>
                  <input
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({
                        ...loginForm,
                        password: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <Captcha
                codigo={captchaCodigo}
                valor={captchaTexto}
                setValor={setCaptchaTexto}
                refrescar={refrescarCaptcha}
              />

              <div className="sitec-form-footer">
                <label className="sitec-remember">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={() => setRemember(!remember)}
                  />
                  Recordarme
                </label>

                <button
                  type="button"
                  className="sitec-forgot"
                  onClick={() => cambiarVista("reset")}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button className="sitec-submit" type="submit" disabled={loading}>
                {loading ? "Validando..." : "Ingresar al sistema"}
              </button>
            </form>
          )}

          {vista === "registro" && (
<form onSubmit={crearCuenta} noValidate>
              <div className="sitec-welcome">Registro institucional</div>

              <h1 className="sitec-title">Crear Cuenta</h1>

              <p className="sitec-subtitle-text">
                La contraseña inicial será el número de carnet.
              </p>

              <label className="sitec-label">Nombres</label>
              <div className="sitec-field">
                <div className="sitec-input-wrap">
                  <span className="sitec-input-icon">NO</span>
                  <input
                    type="text"
                    placeholder="Ej. Juan Carlos"
                    value={registroForm.nombres}
                    onChange={(e) =>
                      setRegistroForm({
                        ...registroForm,
                        nombres: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <label className="sitec-label">Apellidos</label>
              <div className="sitec-field">
                <div className="sitec-input-wrap">
                  <span className="sitec-input-icon">AP</span>
                  <input
                    type="text"
                    placeholder="Ej. Pérez Mamani"
                    value={registroForm.apellidos}
                    onChange={(e) =>
                      setRegistroForm({
                        ...registroForm,
                        apellidos: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

<label className="sitec-label">Correo institucional</label>
<div className="sitec-field">
  <div className="sitec-input-wrap">
    <span className="sitec-input-icon">@</span>

    <div className="sitec-email-control">
      <input
        type="text"
        placeholder="lflarico"
        value={registroForm.correo}
        onChange={(e) =>
          setRegistroForm({
            ...registroForm,
            correo: limpiarUsuarioCorreo(e.target.value),
          })
        }
      />

      <span className="sitec-email-domain">
        @umsa.bo
      </span>
    </div>
  </div>
</div>

              <div className="sitec-grid">
                <div>
                  <label className="sitec-label">Carnet</label>
                  <div className="sitec-field">
                    <div className="sitec-input-wrap">
                      <span className="sitec-input-icon">CI</span>
                      <input
                        type="text"
                        placeholder="12345678"
                        value={registroForm.carnet}
                        onChange={(e) =>
                          setRegistroForm({
                            ...registroForm,
                            carnet: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="sitec-label">Registro universitario</label>
                  <div className="sitec-field">
                    <div className="sitec-input-wrap">
                      <span className="sitec-input-icon">RU</span>
                      <input
                        type="text"
                        placeholder="202012345"
                        value={registroForm.registroUniversitario}
                        onChange={(e) =>
                          setRegistroForm({
                            ...registroForm,
                            registroUniversitario: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Captcha
                codigo={captchaCodigo}
                valor={captchaTexto}
                setValor={setCaptchaTexto}
                refrescar={refrescarCaptcha}
              />

              <button className="sitec-submit" type="submit" disabled={loading}>
                {loading ? "Registrando..." : "Crear cuenta"}
              </button>
            </form>
          )}

          {vista === "reset" && (
<form onSubmit={resetearPassword} noValidate>
              <div className="sitec-welcome">Recuperación de acceso</div>

              <h1 className="sitec-title">Resetear Contraseña</h1>

              <p className="sitec-subtitle-text">
                La contraseña será restablecida a tu número de carnet.
              </p>
<label className="sitec-label">Correo institucional</label>
<div className="sitec-field">
  <div className="sitec-input-wrap">
    <span className="sitec-input-icon">@</span>

    <div className="sitec-email-control">
      <input
        type="text"
        placeholder="lflarico"
        value={resetForm.correo}
        onChange={(e) =>
          setResetForm({
            ...resetForm,
            correo: limpiarUsuarioCorreo(e.target.value),
          })
        }
      />

      <span className="sitec-email-domain">
        @umsa.bo
      </span>
    </div>
  </div>
</div>

              <label className="sitec-label">Carnet</label>
              <div className="sitec-field">
                <div className="sitec-input-wrap">
                  <span className="sitec-input-icon">CI</span>
                  <input
                    type="text"
                    placeholder="12345678"
                    value={resetForm.carnet}
                    onChange={(e) =>
                      setResetForm({
                        ...resetForm,
                        carnet: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <label className="sitec-label">Registro universitario</label>
              <div className="sitec-field">
                <div className="sitec-input-wrap">
                  <span className="sitec-input-icon">RU</span>
                  <input
                    type="text"
                    placeholder="202012345"
                    value={resetForm.registroUniversitario}
                    onChange={(e) =>
                      setResetForm({
                        ...resetForm,
                        registroUniversitario: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <Captcha
                codigo={captchaCodigo}
                valor={captchaTexto}
                setValor={setCaptchaTexto}
                refrescar={refrescarCaptcha}
              />

              <button className="sitec-submit" type="submit" disabled={loading}>
                {loading ? "Procesando..." : "Resetear contraseña"}
              </button>

              <button
                type="button"
                className="sitec-secondary-btn"
                onClick={() => cambiarVista("login")}
              >
                Volver al login
              </button>
            </form>
          )}
{vista === "cambiar-password" && (
  <form onSubmit={cambiarPasswordInicial}>
    <div className="sitec-welcome">Primer ingreso</div>

    <h1 className="sitec-title">Cambiar Contraseña</h1>

    <p className="sitec-subtitle-text">
      Por seguridad, debes cambiar tu contraseña inicial antes de ingresar al sistema.
    </p>

    <label className="sitec-label">Nueva contraseña</label>
    <div className="sitec-field">
      <div className="sitec-input-wrap sitec-input-clean">
        <input
          type="password"
          placeholder="Ej. Luis12"
          value={cambioPasswordForm.nuevaPassword}
          onChange={(e) =>
            setCambioPasswordForm({
              ...cambioPasswordForm,
              nuevaPassword: e.target.value,
            })
          }
        />
      </div>
    </div>

    <div className="sitec-password-rules">
      <p className={reglasPassword.longitud ? "ok" : ""}>
        Entre 6 y 8 caracteres
      </p>

      <p className={reglasPassword.mayuscula ? "ok" : ""}>
        Al menos una letra mayúscula
      </p>

      <p className={reglasPassword.minuscula ? "ok" : ""}>
        Al menos una letra minúscula
      </p>

      <p className={reglasPassword.numero ? "ok" : ""}>
        Al menos un número
      </p>
    </div>

    <label className="sitec-label">Confirmar contraseña</label>
    <div className="sitec-field">
      <div className="sitec-input-wrap sitec-input-clean">
        <input
          type="password"
          placeholder="Repite la nueva contraseña"
          value={cambioPasswordForm.confirmarPassword}
          onChange={(e) =>
            setCambioPasswordForm({
              ...cambioPasswordForm,
              confirmarPassword: e.target.value,
            })
          }
        />
      </div>
    </div>

    <button className="sitec-submit" type="submit" disabled={loading}>
      {loading ? "Guardando..." : "Guardar nueva contraseña"}
    </button>
  </form>
)}

          <div className="sitec-help">
            Facultad de Tecnología - Universidad Mayor de San Andrés
          </div>
        </div>
      </section>
    </div>
  );
}

function Captcha({ codigo, valor, setValor, refrescar }) {
  return (
    <div className="sitec-captcha-box">
      <div className="sitec-captcha-top">
        <div className="sitec-captcha-code">{codigo}</div>

        <button
          type="button"
          className="sitec-captcha-refresh"
          onClick={refrescar}
          title="Generar nuevo código"
        >
          ↻
        </button>
      </div>

      <div className="sitec-captcha-input">
        <div className="sitec-captcha-side"></div>

        <input
          type="text"
          placeholder="Ingresa el Código de Seguridad"
          value={valor}
          maxLength={4}
          onChange={(e) => setValor(e.target.value.toUpperCase())}
        />

        <div className="sitec-captcha-edit">✎</div>
      </div>
    </div>
  );
}

export default Login;