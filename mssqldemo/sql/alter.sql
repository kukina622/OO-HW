alter table [Order] drop constraint [DF__Order__done__276EDEB3];
ALTER TABLE [Order] DROP COLUMN done; 

ALTER TABLE [Order]
ADD status varchar(15) NOT NULL DEFAULT 'Pending'; 

ALTER TABLE [Order]
ADD CONSTRAINT [status_check] CHECK([status] IN('Pending','Confirmed','Completed','Cancelled', 'Preparing'))

ALTER TABLE [Product] ADD image text; 

ALTER TABLE Member ADD mAddress VARCHAR(50);
ALTER TABLE Member DROP COLUMN mRegion;

exec sp_rename 'Restaurant', 'Manager'

ALTER TABLE [Product] ADD Category varchar(50); 

ALTER TABLE [Order] DROP CONSTRAINT status_check; 
ALTER TABLE [Order]
ADD CONSTRAINT [status_check] CHECK([status] IN(
  'Pending',
  'Preparing',
  'Shipped',
  'Completed', 
  'Cancelled'
));
