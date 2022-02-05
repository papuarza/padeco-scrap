const express = require('express');
const router  = express.Router();
const scrapeIt = require("scrape-it");


/* GET home page */
router.get('/', (req, res, next) => {
  res.render('index');
});

router.get('/asin', (req, res, next) => {
  let url = `https://amazon.es/dp/${req.query.asin}`;
  scrapeIt(url, {
    title: "#productTitle"
  , desc: {
    listItem: ".a-unordered-list.a-vertical.a-spacing-mini > li > span"
  },
  aPlusBrand: {
    listItem: "#aplusBrandStory_feature_div .celwidget",
    name: "aPlusBrand",
    data: {
      value: {
        selector: "div"
      }
    }
  },
  aPlusProduct: {
  listItem: "#dpx-aplus-product-description_feature_div .celwidget",
  name: "aPlusProduct",
  data: {
    value: {
      selector: ".aplus-module-wrapper"
    }
  }
}, 
aPlusProduct3P: {
  listItem: "#dpx-aplus-3p-product-description_feature_div .celwidget",
  name: "aPlusProduct3P",
  data: {
    value: {
      selector: ".aplus-module-wrapper"
    }
  }
}, 
  imgs: {
    listItem: "#altImages li",
    name: "imgs",
    data: {
      url: {
        selector: "img",
        attr: "src"
      }
    }
  },
  info: {
    listItem: "#poExpander tr",
    name: "info",
    data: {
      title: {
        selector: ".a-text-bold"
      },
      value: {
        selector: ".a-span9 span"
      }
    }
  },
  precio: {
    selector: ".priceToPay > span"
  },
  enviador: {
    selector: '.tabular-buybox-text[tabular-attribute-name="Envío desde"]'
  },
  vendedor: {
    selector: '.tabular-buybox-text[tabular-attribute-name="Vendido por"]'
  },
  cantidadValoraciones: {
    selector: "#acrCustomerReviewText",
    how: "html"
  },
  cantidadEstrellas: {
    selector: "#acrPopover .a-icon-alt",
    how: "html"
  },
  longDesc: {
    listItem: ".a-expander-content > .a-unordered-list > li > span"
  },
detalles: {
  listItem: "#detailBullets_feature_div > .a-unordered-list > li > span",
  how: "html"
},
  categorias: {
    listItem: "#productDetails_detailBullets_sections1 tr",
    name: "categorias",
    data: {
      title: {
        selector: ".prodDetSectionEntry"
      },
      value: {
        selector: "td"
      }
    }
  },
  detallesTecnicos: {
    listItem: "#productDetails_techSpec_section_1 tr",
    name: "detallesTecnicos",
    data: {
      title: {
        selector: ".prodDetSectionEntry"
      },
      value: {
        selector: ".prodDetAttrValue"
      }
    }
  }
  }).then(({ data, response }) => {
    console.log(`Status Code: ${response.statusCode}`)
    data.categorias = data.categorias[2];
    console.log(data)
    let finalImages = [];
    data.imgs.forEach((i) => {
      let format = i.url.substr(i.url.length - 3)
      if(i.url !== "" && format !== "gif") finalImages.push(i);
    })

    let bulletsPerformance = data.desc.map((d) => {
      return d.length/500
    })
    let bulletsPerformanceAvg = bulletsPerformance.reduce((a,b) => a+b) / bulletsPerformance.length;
    
    let detallesTecnicos = 0;
    if(data.detallesTecnicos.length > 10) {
      detallesTecnicos = '100%'
    } else if (data.detallesTecnicos.length > 2) {
      detallesTecnicos = '75%'
    }

    let cantidadReviews = 0;
    let cantidadReviewsScore = 0;
    if(data.cantidadValoraciones) {
      cantidadReviews = parseInt((data.cantidadValoraciones.substr(0, data.cantidadValoraciones.indexOf('valoraciones'))).replace(".", ""));
      if(cantidadReviews > 25) {
        cantidadReviewsScore = '100%'
      }
    }

    let categoriasFinales = [];
    if(data.categorias) {
       categoriasFinales = data.categorias.value.split('nº');
      categoriasFinales = categoriasFinales.splice(1, categoriasFinales.length);
      categoriasFinales = categoriasFinales.map((cat) => {
        let text = cat.trim();
        if (cat.indexOf('(') > 0) text = cat.substr(0, cat.indexOf('('));
        return text;
      })
    }

    let enviadoScore = 20;
    if(data.enviador) {
      if(data.enviador == 'Amazon') enviadoScore = 100;
    }

    let aplusProducto = false;
    if(data.aPlusProduct.length > 0 || data.aPlusProduct3P.length > 0) aplusProducto = true;

    let aplusBrand = false;
    if(data.aPlusBrand.length > 0 || data.aPlusBrand.length > 0) aplusBrand = true;

    let productoData = {
      title: {
        content: data.title,
        length: data.title.length,
        score: Math.round(data.title.length/180*100)
      },
      precio: {
        content: data.precio.substr(0, data.precio.indexOf('€'))
      },
      imgs: {
        main: finalImages[0],
        length: finalImages.length,
        score: Math.round(finalImages.length/7*100),
      },
      description: {
        length: data.desc.length,
        score: Math.floor(data.desc.length/5)*100,
        bulletsPerformanceAvg: Math.round(bulletsPerformanceAvg*100)
      },
      detallesTecnicos: {
        length: data.detallesTecnicos.length,
        score: detallesTecnicos
      },
      cantidadReviews: {
        length: cantidadReviews,
        score: cantidadReviewsScore,
        calificacion: data.cantidadEstrellas
      },
      categorias: {
        principal: categoriasFinales[0],
        secundarias: categoriasFinales.splice(1, categoriasFinales.length)
      },
      vendido: {
        content: data.vendedor
      },
      enviado: {
        content: data.enviador,
        score: enviadoScore
      },
      aPlusBrand: {
        content: aplusBrand
      },
      aPlusProduct: {
        content: aplusProducto
      }
    }
    console.log(productoData)
    res.render('asin', {productoData})
})
  
});

module.exports = router;

    