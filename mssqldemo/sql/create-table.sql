CREATE TABLE Member(
	mEmail 		VARCHAR(20)		NOT NULL,
	mPassword	VARCHAR(20)		NOT NULL,
	birthday	DATE,
	mRegion		NVARCHAR(20)	NOT NULL,
	mName		VARCHAR(20)		NOT NULL,
	PRIMARY KEY (mEmail)
);

CREATE TABLE Restaurant(
	rId 		CHAR(36)		NOT NULL,
	rName		NVARCHAR(20)	NOT NULL,
	rRegion		NVARCHAR(20)	NOT NULL,
	phone		VARCHAR(20),
	email		VARCHAR(20)		NOT NULL,
	password	VARCHAR(20)		NOT NULL,
	address		NVARCHAR(20),
	
	-- -1: DELETED
	--  0: NOT AVAILABLE
	--  1: AVAILABLE
	rIsAvailable	INT			NOT NULL,
	PRIMARY KEY (rId),
);

CREATE TABLE [Order](
	oId			CHAR(36)		NOT NULL,
	oDate		DATE			NOT NULL,
	total		INT				NOT NULL,
	
	-- 0: PROCESSING
	-- 1: DONE
	done 		INT				DEFAULT 0,
	mId			VARCHAR(20)		NOT NULL,
	rId 		CHAR(36)		NOT NULL,
	PRIMARY KEY (oId),
	FOREIGN KEY (mId) REFERENCES Member(mEmail),
	FOREIGN KEY (rid) REFERENCES Restaurant(rId)
);

CREATE TABLE Product(
	pId			CHAR(36)		NOT NULL,
	pCount		INT,
	unitPrice	INT				NOT NULL,
	pName		VARCHAR(20)		NOT NULL,

	-- -2: DELETE
	-- -1: HIDDEN
	--  0: OUT OF STOCK
	-- >0: IN STOCK
	-- NULL: NOT LIMITED
	rId			CHAR(36)		NOT NULL,
	PRIMARY KEY (pId),
	FOREIGN KEY (rId) REFERENCES Restaurant(rId)
	ON DELETE CASCADE
);

CREATE TABLE Cart(
	mId			VARCHAR(20)		NOT NULL,
	cTime		DATETIME		NOT NULL,
	count		INT				NOT NULL,
	unitPrice 	INT				NOT NULL,
	price		INT,
	oId			CHAR(36),
	pId			CHAR(36)		NOT NULL,
	PRIMARY KEY (mId, cTime),
	FOREIGN KEY (mId) REFERENCES Member(mEmail),
	FOREIGN KEY (oId) REFERENCES [Order](oId) ON DELETE CASCADE,
	FOREIGN KEY (pId) REFERENCES Product(pId)
);

