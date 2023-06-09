/*********************************************************************************
*  WEB322 – Assignment 05
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Japan Sheth  Student ID: 159777218 Date: 23-11-2022
*
*  Cyclic Web App URL: https://dull-cyan-sheep-sock.cyclic.app
*
*  GitHub Repository URL: https://github.com/jsheth2/web322-app
*
********************************************************************************/

var express = require("express");
var app = express();
var path = require("path");
var blogservice = require(__dirname + '/blog-service.js');
var HTTP_PORT = process.env.PORT || 8080;
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
const exphbs = require('express-handlebars');
const stripJs = require('strip-js');

cloudinary.config({
  cloud_name: 'dhsrmrhz0',
  api_key: '712315413854177',
  api_secret: 'JdflEn8Hx0dSkYX4xCus_tjM0pI',
  secure: true
});

const upload = multer(); // no { storage: storage } since we are not using disk storage

//DEFINE TEMPALATE ENGINE
app.engine('.hbs', exphbs.engine({
  extname: '.hbs',
  helpers: {
    navLink: function (url, options) {
      return '<li' +
        ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
        '><a href="' + url + '">' + options.fn(this) + '</a></li>';
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    },
    safeHTML: function (context) {
      return stripJs(context);
    },
    formatDate: function (dateObj) {
      let year = dateObj.getFullYear();
      let month = (dateObj.getMonth() + 1).toString();
      let day = dateObj.getDate().toString();
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

  }
}));

app.use(express.urlencoded({ extended: true }));

app.set('view engine', '.hbs');

app.get("/", function (req, res) {
  res.redirect("/blog");
});

//middleware function
app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

app.use(express.static("public"));



app.get("/about", function (req, res) {
  res.render('about')
});

app.get('/blog', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try {

    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogservice.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogservice.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest post from the front of the list (element 0)
    let post = posts[0];

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
    viewData.post = post;

  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogservice.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", { data: viewData })

});

app.get('/blog/:id', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try {

    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogservice.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogservice.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;

  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the post by "id"
    viewData.post = await blogservice.getPostById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogservice.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", { data: viewData })
});

app.get("/posts", function (req, res) {
  // /posts?category=value 
  if (req.query.category < 6 && req.query.category > 0) {
    blogservice.getPostsByCategory(req.query.category).then((data) => {
      if (data.length > 0) {
        res.render("posts", { posts: data });
      }
      else {
        res.render("posts", { message: "No results" });
      }
    })
      .catch(() => {
        res.render("posts", { message: "No results" });
      });
  }

  // /posts?minDate=value
  else if (req.query.minDate != null) {
    blogservice.getPostsByMinDate(req.query.minDate).then((data) => {
      if (data.length > 0) {
        res.render("posts", { posts: data });
      }
      else {
        res.render("posts", { message: "No results" });
      }
    }).catch(function () {
      res.render("posts", { message: "No results" });
    })
  }
  else {
    blogservice.getAllPosts().then(function (data) {
      if (data.length > 0) {
        res.render("posts", { posts: data });
      }
      else {
        res.render("posts", { message: "No results" });
      }
    })
      .catch(function (err) {
        res.render("posts", { message: "no results" });
      });
  }
}
);

//"/post/value" route 
app.get('/post/:id', (req, res) => {
  blogservice.getPostById(req.params.id).then((data) => {
    res.json(data);
  }).catch(function (err) {
    res.json({ message: err });
  });
});

app.get("/categories", function (req, res) {
  blogservice.getCategories().then(function (data) {
    if (data.length > 0) {
      res.render("categories", { categories: data });
    }
    else {
      res.render("categories", { message: "No results" });
    }
  })
    .catch(function () {
      res.render("categories", { message: "No results" });
    })
});

app.get("/categories/add", (req, res) => {
  res.render("addCategory");
});

app.post("/categories/add", (req, res) => {
  blogservice.addCategory(req.body).then(() => {
    res.redirect("/categories");
  }).catch(console.log("Unable to Add category"));
});

app.get("/categories/delete/:id", (req, res) => {
  blogservice.deleteCategoryById(req.params.id).then(() => {
    res.redirect("/categories");
  }).catch(console.log("Unable to Remove Category / Category not found)"));
});

app.get("/posts/add", function (req, res) {
  blogservice.getCategories().then((data) => {
    res.render("addPost", {
      categories: data,
    });
  }).catch(() => {
    res.render("addPost"), { categories: [] };
  });
});

app.get("/posts/delete/:id", (req, res) => {
  blogservice.deletePostById(req.params.id).then(() => {
    res.redirect("/posts");
  }).catch(console.log("Unable to Remove Post / Post not found"));
});

app.post('/posts/add', upload.single("featureImage"), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
    }

    upload(req).then((uploaded) => {
      processPost(uploaded.url);
    });
  } else {
    processPost("");
  }

  function processPost(imageUrl) {
    req.body.featureImage = imageUrl;

    // TODO: Process the req.body and add it as a new Blog Post before redirecting to /posts
    blogservice.addPost(req.body).then(() => {
      res.redirect('/posts');
    }).catch((data) => { res.send(data); })
  }
});


app.get("*", (req, res) => {
  res.status(404).render("404");
});

// http server to listen on HTTP_PORT
blogservice.initialize()
  .then(() => {
    app.listen(HTTP_PORT, onHttpStart);
  })
  .catch(() => {
    console.log("ERROR : From starting the server");
  });