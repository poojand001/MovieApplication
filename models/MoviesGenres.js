const movies = require("./Movies.js");
const genre = require("./Genres.js");
module.exports = (sequelize, Sequelize) => {
    const MoviesGenres = sequelize.define("MoviesGenres", {
        MovieId: {
            type: Sequelize.INTEGER,
            references: {
                model: movies,
                key: 'Id'
            }
        },
        GenreId: {
            type: Sequelize.INTEGER,
            references: {
                model: genre,
                key: 'Id'
            }
        }
    });
    return MoviesGenres;
};