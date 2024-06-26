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

-- This steps is to edit the visual novel table to change the primary key to game instead of ID
-- Step 1: Remove the current primary key constraint
ALTER TABLE visualnovel DROP CONSTRAINT visualnovel_pkey;

-- Step 2: Ensure the game column is unique
ALTER TABLE visualnovel ADD CONSTRAINT unique_game UNIQUE (game);

-- Step 3: Add the game column as the primary key
ALTER TABLE visualnovel ADD PRIMARY KEY (game);

-- Step 4 Add a Unique Constraint on the id Column
ALTER TABLE visualnovel ADD CONSTRAINT unique_id UNIQUE (id);

CREATE TABLE IF NOT EXISTS uservisualnovel(
	id INT,
	game varchar(255) PRIMARY KEY,
	last_played DATE,
	last_updated DATE,
    status varchar(50),
	FOREIGN KEY (id) REFERENCES visualnovel(id),
	FOREIGN KEY (game) REFERENCES visualnovel(game)
);

-- Populate the Foreign Keys
INSERT INTO uservisualnovel (id,game)
SELECT id, game FROM visualnovel;

-- Populate data columns
UPDATE uservisualnovel
SET last_played = '2024-06-03';

-- Add a new column to the visualnovel table
CREATE OR REPLACE FUNCTION set_id_from_visualnovel()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO uservisualnovel (id,game, last_played) values (new.id,new.game, CURRENT_DATE);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to set the id value
CREATE TRIGGER set_id_value_trigger
AFTER INSERT ON visualnovel
FOR EACH ROW
EXECUTE FUNCTION set_id_from_visualnovel();

-- To reset
-- ALTER SEQUENCE visualnovel_id_seq RESTART WITH 33

ALTER TABLE uservisualnovel
ADD last_played_ver varchar(50);
ALTER TABLE uservisualnovel
ADD last_updated_ver varchar(50);

