function BannerBienvenida() {
  return (
    <section className="banner">

      <div>

        <p className="mini-title">
          ¡BIENVENIDO DE VUELTA!
        </p>

        <h1>
          Hola, Juan 👋
        </h1>

        <p>
          Explora el catálogo de recursos de la Facultad.
        </p>

      </div>

      <div className="banner-buttons">

        <button className="gold-btn">
          Explorar Catálogo
        </button>

        <button className="border-btn">
          Sugerir un Libro
        </button>

      </div>

    </section>
  );
}

export default BannerBienvenida;