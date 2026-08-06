require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

// Permite abrir index.html, panel.html, etc.
app.use(express.static("."));

const API_KEY = process.env.YOUTUBE_API_KEY;

// Cambia esto si tu rockola no está en Colombia
const PAIS = "CO";


// BUSCADOR DE YOUTUBE
app.get("/search", async (req, res) => {

    const q = req.query.q;

    if (!q) {
        return res.status(400).json({
            error: "Falta el parámetro q"
        });
    }


    try {

        const respuesta = await axios.get(
            "https://www.googleapis.com/youtube/v3/search",
            {
                params: {
                    part: "snippet",
                    q: q + " official audio",
                    type: "video",
                    videoCategoryId: "10",
                    maxResults: 8,
                    key: API_KEY
                }
            }
        );

        const items = respuesta.data.items;

        if (items.length === 0) {
            return res.json([]);
        }

        // === Verificamos cuáles videos SÍ se pueden reproducir aquí ===

        const ids = items.map(item => item.id.videoId).join(",");

        const detalles = await axios.get(
            "https://www.googleapis.com/youtube/v3/videos",
            {
                params: {
                    part: "status,contentDetails",
                    id: ids,
                    key: API_KEY
                }
            }
        );

        const disponibles = new Set(
            detalles.data.items
                .filter(v => {

                    // 1) Debe permitir reproducirse embebido
                    if (v.status.embeddable !== true) {
                        return false;
                    }

                    // 2) No debe estar bloqueado para nuestro país
                    const restriccion = v.contentDetails?.regionRestriction;

                    if (restriccion?.blocked?.includes(PAIS)) {
                        return false;
                    }

                    // 3) Si el video usa "allowed" (lista blanca de países)
                    //    y el nuestro no está en ella, también se descarta
                    if (restriccion?.allowed && !restriccion.allowed.includes(PAIS)) {
                        return false;
                    }

                    return true;

                })
                .map(v => v.id)
        );

        const resultados = items
            .filter(item => disponibles.has(item.id.videoId))
            .slice(0, 5)
            .map(item => ({

                videoId: item.id.videoId,

                titulo: item.snippet.title,

                canal: item.snippet.channelTitle,

                miniatura: item.snippet.thumbnails.medium.url

            }));


        res.json(resultados);


    } catch (error) {

        console.error(
            error.response?.data || error.message
        );


        res.status(500).json({

            error: "Error consultando YouTube"

        });

    }

});


// INICIO DEL SERVIDOR
app.listen(process.env.PORT || 3000, () => {

    console.log(
        `Servidor iniciado en http://localhost:${process.env.PORT || 3000}`
    );

});
