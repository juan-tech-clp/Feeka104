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
                    maxResults: 5,
                    key: API_KEY
                }
            }
        );


        const resultados = respuesta.data.items.map(item => ({

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