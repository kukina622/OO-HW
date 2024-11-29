import appInit from "./app";

appInit().then((app) => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log("Server started on port 3000");
  });
});
