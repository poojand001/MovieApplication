module.exports = (sequelize, Sequelize) => {
    const Movies = sequelize.define("Movies", {
        Id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        Name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        IMDB_Score: {
            type: Sequelize.DECIMAL
        },
        Popularity: {
            type: Sequelize.DECIMAL
        },
        Director: {
            type: Sequelize.STRING
        }
    });

    return Movies;
};