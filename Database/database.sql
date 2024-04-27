CREATE TABLE IF NOT EXISTS visualNovel (
    Game VARCHAR(255) PRIMARY KEY,
    Year INT,
    Developer VARCHAR(255),
    Genre1 VARCHAR(255),
    Genre2 VARCHAR(255),
    Story FLOAT,
    Renders FLOAT,
    Animations FLOAT,
    Scenes FLOAT,
    Rating FLOAT,
    Fav1 VARCHAR(50),
    Fav2 VARCHAR(50),
    Fav3 VARCHAR(50)

);

CREATE TABLE IF NOT EXISTS figurine(
    Item VARCHAR(255) PRIMARY KEY,
    Brand VARCHAR(255),
    Retailer VARCHAR(255),
    FigurePrice FLOAT,
    ShippingPrice FLOAT,
    TotalPrice FLOAT,
    Scale VARCHAR(50),
    ItemType VARCHAR(50),
    Series VARCHAR(50),
    Rating FLOAT,
    ReleaseYear INT
);

CREATE TABLE IF NOT EXISTS multiGames(
    Game VARCHAR(255) PRIMARY KEY,
    Year INT,
    Developer VARCHAR(255),
    Genre VARCHAR(255),
    SubGenre VARCHAR(255),
    Gameplay VARCHAR(255),
    Type VARCHAR(255),
    Rating FLOAT
);

CREATE TABLE IF NOT EXISTS games(
    Game VARCHAR(255) PRIMARY KEY,
    Year INT,
    Developer VARCHAR(255),
    Genre VARCHAR(255),
    SubGenre VARCHAR(255),
    Gameplay VARCHAR(255),
    Type VARCHAR(255),
    Rating FLOAT,
    Favourite VARCHAR(255),
    Highlights VARCHAR(255)
)