const express = require('express');
const redis = require('redis');
const mongo = require('mongodb');



const APP_PORT = process.env.APP_PORT || 3000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const MONGODB_PORT = process.env.MONGODB_PORT || 27017;
const MONGODB_HOST = process.env.MONGODB_HOST || 'localhost';
const MONGODB_DBNAME = process.env.MONGODB_DBNAME || 'peta';


const url = `mongodb://${MONGODB_HOST}:${MONGODB_PORT}/`;

const redisclient = redis.createClient(REDIS_PORT);

const redixCacheMiddleware = (req, res, next) =>{
    const { prov } = req.params;
    const start = new Date()
    redisclient.get(prov, (err, spatialdata) => {
      if (err) throw err;
  
      if (spatialdata !== null) {
        res.send(`<p> with Redix cache: ${new Date()-start} </p>`);
      } else {
        next();
      }
    });
}

//getting value from Mongo DB
const getspatial = async (req, res, next)=>{
    
    const { prov } = req.params;
    
    const start =  new Date()

    try{

        let spatialdata;

        mongo.MongoClient.connect(url,{ useUnifiedTopology: true }, function(err, db) {
            if (err) throw err;
        
            const dbo = db.db(MONGODB_DBNAME);
        
            dbo.collection("provinsi").findOne({'properties.KODE':Number(prov)}, (err, result)=> {
                
                if (err) throw err;
                
                spatialdata = result

                // out data as a key-value pair in REDIS
                redisclient.setex(prov, 3600, JSON.stringify(spatialdata));

                res.send(`<p> got data from MongoDB: ${new Date()-start} </p>`);

                db.close();
            });
        });


      }catch (err) {
        
        console.error(err);
        res.status(500);

      }

}

const getspatialori = async (req, res, next)=>{
    
    const { prov } = req.params;
    
    const start =  new Date()

    try{

        let spatialdata;

        mongo.MongoClient.connect(url,{ useUnifiedTopology: true }, function(err, db) {
            if (err) throw err;
        
            const dbo = db.db(MONGODB_DBNAME);
        
            dbo.collection("provinsi").findOne({'properties.KODE':Number(prov)}, (err, result)=> {
                
                if (err) throw err;
                
                spatialdata = result

                res.send(`<p> ${JSON.stringify(spatialdata)} </p>`);

                db.close();
            });
        });


      }catch (err) {
        
        console.error(err);
        res.status(500);

      }

}


const app = express();


//just to see original data
app.get('/getspatialori/:prov', getspatialori)


//using redis cache
app.get('/getspatial/:prov',redixCacheMiddleware, getspatial)


app.listen(APP_PORT, () => {
  console.log(`App listening on port ${APP_PORT}`);
});