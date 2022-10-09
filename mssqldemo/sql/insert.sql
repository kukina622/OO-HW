
-- Restaurants
INSERT INTO Restaurant(rId, rName, rRegion, email, password, rIsAvailable) VALUES (
    '7f20e3a3-e080-44f5-aacb-87af3d72a011',
    'Test1',
    '桃園市',
    'manager1@test.com',
    '111',
    1
);
INSERT INTO Restaurant(rId, rName, rRegion, email, password, rIsAvailable) VALUES (
    '0a553f56-7710-4590-aa88-53847b3cc43c',
    'Test2',
    '桃園市',
    'manager2@test.com',
    '111',
    1
);
INSERT INTO Restaurant(rId, rName, rRegion, email, password, rIsAvailable) VALUES (
    '29b7d721-e2b1-4c73-8768-d30e659ac31d',
    'Test3',
    '台北市',
    'manager3@test.com',
    '111',
    1
);


-- Products Restatrant 1
INSERT INTO Product(pId, pCount, unitPrice, pName, rId) VALUES (
    'e54f8cd2-7768-444b-acaa-c1742e96621d',
    NULL,
    100,
    'Test1',
    '7f20e3a3-e080-44f5-aacb-87af3d72a011'
)
INSERT INTO Product(pId, pCount, unitPrice, pName, rId) VALUES (
    '9fe35ff6-c84e-4469-b0a3-131b3551efb2',
    NULL,
    50,
    'Test2',
    '7f20e3a3-e080-44f5-aacb-87af3d72a011'
)
INSERT INTO Product(pId, pCount, unitPrice, pName, rId) VALUES (
    'eb9d40eb-9889-455f-8d9b-8d33468ffab2',
    NULL,
    150,
    'Test3',
    '7f20e3a3-e080-44f5-aacb-87af3d72a011'
)
INSERT INTO Product(pId, pCount, unitPrice, pName, rId) VALUES (
    'fb7d6899-9cc0-42f9-a076-f7da9445f4c2',
    NULL,
    70,
    'Test4',
    '7f20e3a3-e080-44f5-aacb-87af3d72a011'
)
INSERT INTO Product(pId, pCount, unitPrice, pName, rId) VALUES (
    '251997ce-4463-41ff-9689-caa7425634de',
    NULL,
    90,
    'Test5',
    '7f20e3a3-e080-44f5-aacb-87af3d72a011'
)

-- Product Restaurant 2
INSERT INTO Product(pId, pCount, unitPrice, pName, rId) VALUES (
    'eec7aa3d-c1b9-46ef-8ea3-32bd45fc41a2',
    NULL,
    100,
    'TestA',
    '0a553f56-7710-4590-aa88-53847b3cc43c'
)
INSERT INTO Product(pId, pCount, unitPrice, pName, rId) VALUES (
    'c9fde7a2-7b2c-4a32-a21d-dd0ab249cf0c',
    NULL,
    50,
    'TestB',
    '0a553f56-7710-4590-aa88-53847b3cc43c'
)
INSERT INTO Product(pId, pCount, unitPrice, pName, rId) VALUES (
    '7635d55d-7ea8-4b35-bc0c-5cfc0d629464',
    NULL,
    150,
    'TestC',
    '0a553f56-7710-4590-aa88-53847b3cc43c'
)

-- Member
INSERT INTO Member(mEmail, mPassword, mRegion, mName) VALUES (
    'm1@test.com',
    '111',
    '桃園市',
    'Test1'
)
INSERT INTO Member(mEmail, mPassword, mRegion, mName) VALUES (
    'm2@test.com',
    '111',
    '桃園市',
    'Test1'
)