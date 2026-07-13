-- seed.sql
-- Seed the 18 barangays for Presentacion, Camarines Sur

INSERT INTO public.barangays (name, district) VALUES
    ('Ayugao', NULL),
    ('Bagong Sirang', NULL),
    ('Baliguian', NULL),
    ('Bantugan', NULL),
    ('Bicalen', NULL),
    ('Bitaogan', NULL),
    ('Buenavista', NULL),
    ('Bulalacao', NULL),
    ('Cagnipa', NULL),
    ('Lagha', NULL),
    ('Lidong', NULL),
    ('Liwacsa', NULL),
    ('Maangas', NULL),
    ('Pagsangahan', NULL),
    ('Patrocinio', NULL),
    ('Pili', NULL),
    ('Santa Maria (Pob.)', NULL),
    ('Tanawan', NULL)
ON CONFLICT (name) DO NOTHING;
