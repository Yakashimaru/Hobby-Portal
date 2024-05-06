CREATE TABLE IF NOT EXISTS visualNovel (
    ID SERIAL PRIMARY KEY,
    Game VARCHAR(255),
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
    ID SERIAL PRIMARY KEY, 
    Item VARCHAR(255),
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
    ID SERIAL PRIMARY KEY, 
    Game VARCHAR(255),
    Year INT,
    Developer VARCHAR(255),
    Genre VARCHAR(255),
    SubGenre VARCHAR(255),
    Gameplay VARCHAR(255),
    Type VARCHAR(255),
    Rating FLOAT
);

CREATE TABLE IF NOT EXISTS games(
    ID SERIAL PRIMARY KEY, 
    Game VARCHAR(255),
    Year INT,
    Developer VARCHAR(255),
    Genre VARCHAR(255),
    SubGenre VARCHAR(255),
    Gameplay VARCHAR(255),
    Type VARCHAR(255),
    Rating FLOAT,
    Favourite VARCHAR(255),
    Highlights VARCHAR(255)
);

ALTER TABLE figurine RENAME COLUMN figureprice to figure_price;
ALTER TABLE figurine RENAME COLUMN shippingprice to shipping_price;
ALTER TABLE figurine RENAME COLUMN totalprice to total_price;
ALTER TABLE figurine RENAME COLUMN itemtype to item_type;
ALTER TABLE figurine RENAME COLUMN releaseyear to release_year;
ALTER TABLE games RENAME COLUMN subgenre to sub_genre;
ALTER TABLE multigames RENAME COLUMN subgenre to sub_genre;
ALTER TABLE visualnovel RENAME COLUMN genre1 to genre_1;
ALTER TABLE visualnovel RENAME COLUMN genre2 to genre_2;
ALTER TABLE visualnovel RENAME COLUMN fav1 to fav_1;
ALTER TABLE visualnovel RENAME COLUMN fav2 to fav_2;
ALTER TABLE visualnovel RENAME COLUMN fav3 to fav_3;

CREATE TABLE IF NOT EXISTS kpop(
	id SERIAL PRIMARY KEY,
    Rank INT,
    Name VARCHAR(255),
    Type VARCHAR(255)
);