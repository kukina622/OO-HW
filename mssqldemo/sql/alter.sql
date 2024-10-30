alter table [Order] drop constraint [DF__Order__done__276EDEB3];
ALTER TABLE [Order] DROP COLUMN done; 

ALTER TABLE [Order]
ADD status varchar(15) NOT NULL DEFAULT 'Pending'; 

ALTER TABLE [Order]
ADD CONSTRAINT status CHECK(status IN('Pending','Confirmed','Completed','Cancelled', 'Preparing'))

ALTER TABLE [Product] ADD image text; 