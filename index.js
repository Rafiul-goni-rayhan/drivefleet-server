const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// const { ObjectId } = require('mongodb'); //upload korar age cmnt kore dite hoy ei line
const express = require("express");
dotenv = require("dotenv");

const cors = require("cors");
const app = express();
dotenv.config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createReadStream } = require("node:fs");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const { error } = require("node:console");
const PORT = process.env.PORT;
const uri = process.env.MONGODB_URI;
app.use(cors());
app.use(express.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);
const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  console.log(authHeader);
  if (!authHeader) {
    return res.status(401).json({ message: "unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload);
    next();
  } catch (error) {
    console.log(error);
    return res.status(403).json({ message: "Forbidden" });
  }
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const db = client.db("drivefleet");
    const carCollection = db.collection("car");

    app.post("/car", async (req, res) => {
      const carData = req.body;

      console.log(carData);
      const result = await carCollection.insertOne(carData);
      res.json(result);
    });

    // 2 add kora data dekhanor jonno carpager er jonno api banacchi
    // ------------------------------------------------------------------------
    // app.get("/car", async (req, res) => {
    //   const result = await carCollection.find().toArray();
    //   res.json(result);
    // });

    //3-21 eikhane frontend theke ekta id pathabo ar se match kore oitar data backend theke dibe
    app.get("/car/:id", async (req, res) => {
      const { id } = req.params;
      // console.log(id);
      const result = await carCollection.findOne({ _id: new ObjectId(id) });
      res.json(result);
    });

    // 4-23 eibar edit korar jonno patch api banabo -----------------------------
    app.patch("/car/:id", async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;

      const result = await carCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
      );
      res.json(result);
    });
    //5-24 delete korar jonno ekta router banabo
    app.delete("/car/:id", async (req, res) => {
      const { id } = req.params;
      const result = await carCollection.deleteOne({ _id: new ObjectId(id) });
      res.json(result);
    });

    const bookingCollection = db.collection("bookings");
    app.post("/booking", verifyToken, async (req, res) => {
      try {
        const bookingData = req.body;
        const result = await bookingCollection.insertOne(bookingData);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get("/booking/:userId", verifyToken, async (req, res) => {
      const { userId } = req.params;
      console.log(userId);
      const result = await bookingCollection.find({ userId: userId }).toArray();

      res.json(result);
    });

    app.delete("/booking/:bookingId", verifyToken, async (req, res) => {
      const { bookingId } = req.params;
      const result = await bookingCollection.deleteOne({
        _id: new ObjectId(bookingId),
      });

      res.json(result);
    });
//search
app.get("/car", async (req, res) => {
  try {
    const { search, type } = req.query;

    let query = {};

    console.log("QUERY PARAMS:", req.query); // debug

 if (search) {
  const cleanSearch = search.trim();
  query.carName = {
    $regex: cleanSearch,
    $options: "i",
  };
}

    if (type && type !== "All") {
      query.carType = type;
    }

    console.log("FINAL QUERY:", query); // debug

    const cars = await carCollection.find(query).toArray();

    res.send(cars);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
});
    //   app.get("/booking", async (req, res) => {
    //   try {
    //     const userId = req.query.userId;

    //     const result = await bookingCollection
    //       .find({ userId: userId })
    //       .toArray();

    //     res.send(result);
    //   } catch (error) {
    //     res.status(500).json({ error: error.message });
    //   }
    // });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
// app.METHOD(PATH, HANDLER)
app.get("/", (req, res) => {
  res.send("server is running");
});
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
