# Valid database tables
VALID_TABLES = {
    "games": "games",
    "multigames": "multigames", 
    "visualnovel": "visualnovel",
    "uservisualnovel": "uservisualnovel",
    "kpop": "kpop",
    "figurine": "figurine"
}

VN_TABLE_ORDER = (
    "visualnovel.id, visualnovel.game, visualnovel.year, developer, "
    "genre_1, genre_2, story, renders, animations, scenes, rating, "
    "fav_1, fav_2, fav_3, TO_CHAR(last_played, 'dd/mm/yyyy') as last_played, "
    "TO_CHAR(last_updated, 'dd/mm/yyyy') as last_updated, status, "
    "last_played_ver, last_updated_ver"
)

VN_SORTBY_ORDER = """
ORDER BY
    CASE 
        WHEN status = 'Ongoing' THEN 1
        WHEN status = 'Soon' THEN 2
        WHEN status = 'Completed' THEN 3
        WHEN status = 'Abandoned' THEN 4
        WHEN status = 'Dropped' THEN 5
        ELSE 6 
    END,
    rating DESC NULLS LAST,
    game ASC
""".replace("\n", "").strip()
