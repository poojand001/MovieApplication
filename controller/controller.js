const express = require('express');
const router = express.Router();
const db = require('../models/database.js');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
const authJwt = require("../middleware/authJWT.js")

//Get all the movies if search box is empty else get only the seach input matching movies
router.get('/getmovies', (req, res) => {
    let wherecondition = {};

    if (typeof req.query.search === "undefined") {
        wherecondition = {
            Name: {
                [Op.like]: '%%',
            }
        };
    } else {
        wherecondition[Op.or] = [{
            Name: {
                [Op.iLike]: `%${req.query.search}%`
            }
        }, {
            Director: {
                [Op.iLike]: `%${req.query.search}%`
            }
        }];
    }
    db.Movies.findAll({
        where: wherecondition,
        include: [{
            model: db.Genres,
            through: {
                attributes: []
            }
        }, ],
    }).then(function(movies) {
        res.status(200).send({
            data: movies,
            message: "Successfully fetched list of movies"
        });
    }).catch(function(err) {
        return res.send({
            message: err
        });
    });
});


//Get all the distinct genres
router.get('/getgenres', (req, res) => {
    db.Genres.findAll().then(function(genre) {
        return res.status(200).send({
            message: `Successfully fetched all distinct genres`,
            data: genre
        });
    }).catch(function(err) {
        {
            return res.send({
                message: err
            });
        }
    });
});

//Add movie and genres associated to it
router.post('/addmovie', [authJwt.verifytoken], (req, res) => {
    db.Genres.findAll().then(function(genrelist) {
        let list = req.body.genre.map(s => s.trim());
        var presentgenres = []; //Current list of genres Name present in Genre table
        for (let i = 0; i < genrelist.length; i++) {
            presentgenres.push(genrelist[i].Name.trim());
        }
        if (genrelist.length)
            list = list.filter(f => !presentgenres.includes(f)); //Get the new genres that are not present in Genre table
        let genreinsert = [];
        for (let i = 0; i < list.length; i++) {
            genreinsert.push({
                Name: list[i].trim()
            });
        }
        let genreidname = {}
        for (let i = 0; i < genrelist.length; i++) {
            genreidname[genrelist[i].Name] = genrelist[i].Id;
        }
        db.Genres.bulkCreate( //Add new Genres in bulk in Genre table
            genreinsert
        ).then(function(data) {
            let genreid = [];
            db.Movies.create({ //Add the details of the new movie
                Name: req.body.name,
                IMDB_Score: req.body.imdb_score,
                Director: req.body.director,
                Popularity: req.body.popularity,
            }).then(function(movie) {
                for (let i = 0; i < data.length; i++) {
                    genreidname[data[i].Name.trim()] = data[i].Id; //Mapping of Name and Id of Genre table
                }
                for (let i = 0; i < req.body.genre.length; i++) {
                    genreid.push({
                        GenreId: genreidname[req.body.genre[i].trim()],
                        MovieId: movie.Id
                    });
                }
                db.MoviesGenres.bulkCreate( //Added Mapping of MovieId and GenreId in bulk in MovieGenre table
                    genreid
                ).then(function(data) {
                    return res.send({
                        message: `Successfully added movie ${movie.Name}`
                    });
                }).catch(function(err) {
                    return res.send({
                        message: err
                    })
                });
            }).catch(function(err) {
                return res.send({
                    message: err
                })
            });

        }).catch(function(err) {
            return res.send({
                message: err
            });
        });
    }).catch(function(err) {
        return res.send({
            message: err
        });
    });
});

//Delete a movie 
router.post('/removemovie', [authJwt.verifytoken], (req, res) => {
    db.MoviesGenres.destroy({ //Removed all the genres pertaining to specific movieid fro MovieGenre table
        where: {
            MovieId: req.body.movieid
        }
    }).then(function(data) {
        db.Movies.destroy({ //Deleted the Movie details from Movie table
            where: {
                Id: req.body.movieid
            }
        }).then(function(data) {
            return res.status(200).send({
                message: `Successfully deleted movie`
            });
        }).catch(function(err) {
            return res.send({
                message: err
            });
        });
    }).catch(function(err) {
        return res.send({
            message: err
        });
    });
});

//Edit the movie details and genres associated to it
router.post('/editmovie', [authJwt.verifytoken], (req, res) => {
    db.Movies.update({ //Updated the details of movie in Movie Table
        Director: req.body.director,
        IMDB_Score: req.body.imdb_score,
        Popularity: req.body.popularity
    }, {
        where: {
            Id: req.body.movieid
        }
    }).then(function(data) {
        db.MoviesGenres.destroy({ //Deleted the previously associated genre to this movie
            where: {
                MovieId: req.body.movieid
            }
        }).then(function(data) {
            db.Genres.findAll().then(function(data) {
                let list = req.body.genre.map(s => s.trim());
                let presentgenre = []; //Currently present distinct genres
                for (let i = 0; i < data.length; i++) {
                    presentgenre.push(data[i].Name.trim());
                }
                if (data.length) {
                    list = list.filter(f => !presentgenre.includes(f)); //List will contain if new genres has to be added in Genre table
                }
                let genrelist = [];

                for (let i = 0; i < list.length; i++) {
                    genrelist.push({
                        Name: list[i].trim()
                    });
                }
                let genreidname = {}; //Id and name mapping for genres
                for (let i = 0; i < data.length; i++) {
                    genreidname[data[i].Name] = data[i].Id;
                }

                db.Genres.bulkCreate( //Bulk add the newly added genres for this mvoie
                    genrelist
                ).then(function(addedgenre) {
                    let bulkgenreupdate = [];
                    for (let i = 0; i < addedgenre.length; i++) {
                        genreidname[addedgenre[i].Name.trim()] = addedgenre[i].Id;
                    }
                    for (let i = 0; i < req.body.genre.length; i++) {
                        bulkgenreupdate.push({
                            MovieId: req.body.movieid,
                            GenreId: genreidname[req.body.genre[i].trim()]
                        });
                    }
                    db.MoviesGenres.bulkCreate(bulkgenreupdate).then(function(data) { //Bulk add the different genre associated with this movie in MovieGenre table
                        return res.status(200).send({
                            message: `Updated the details for ${req.body.name}`
                        });
                    }).catch(function(err) {
                        return res.send({
                            message: err
                        });
                    })
                }).catch(function(err) {
                    message: err
                })
            }).catch(function(err) {
                return res.send({
                    message: err
                });
            });
        }).catch(function(err) {
            return res.send({
                message: err
            });
        });
    }).catch(function(err) {
        return res.send({
            message: err
        });
    });
});

//Register the admin user
router.post('/register', (req, res) => { //Register the admin
    db.User.findOne({
        where: {
            EmailId: req.body.emailid
        }
    }).then(function(user) {
        if (user) {
            return res.send({
                message: "EmailId already exists"
            });
        }
        db.User.create({
            UserName: req.body.username,
            EmailId: req.body.emailid,
            Password: bcrypt.hashSync(req.body.password, 8)
        }).then(function(user) {
            return res.status(200).send({
                message: `Successfully added user ${user.UserName}`
            });
        }).catch(function(err) {
            return res.send({
                message: err
            });
        });
    }).catch(function(err) {
        return res.send({
            message: err
        });
    })
});


//Login for admin user
router.post('/login', (req, res) => { //login of admin and generating access token for authorization 
    db.User.findOne({
        where: {
            EmailId: req.body.emailid
        }
    }).then(function(user) {
        if (!user) {
            return res.send({
                message: "EmailId does not exist"
            });
        }

        var passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.Password
        );
        if (!passwordIsValid) {
            return res.send({
                accessToken: null,
                message: "Invalid Password!"
            });
        }
        var token = jwt.sign({ id: user.UserName }, process.env.SECRET, {
            expiresIn: 86400
        });
        return res.status(200).send({
            message: `Successfully logged in`,
            accessToken: token,
            EmailId: req.body.emailid,
            UserName: user.UserName
        });
    }).catch(function(err) {
        return res.send({
            message: err
        });
    })
});

module.exports = router;