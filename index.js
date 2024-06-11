const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');

const Clients = require('./models/Clients');
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');

const app = express();
const PORT = 5000;
require('dotenv').config();

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI);

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

const upload = multer({ storage: multer.memoryStorage() });

app.post('/clients', upload.single('image'), async (req, res) => {
  const { name, duration } = req.body;
  let imageUrl = '';

  if (req.file) {
    const timestamp = Date.now();
    const imageName = `${timestamp}_${req.file.originalname}`; 
    const imageRef = ref(storage, `images/${imageName}`);
    await uploadBytes(imageRef, req.file.buffer);
    imageUrl = await getDownloadURL(imageRef);
  }

  const client = new Clients({ name, image: imageUrl, duration });
  await client.save();
  res.send(client);
});

app.get('/clients', async (req, res) => {
  const clients = await Clients.find();
  res.send(clients);
});

app.put('/clients/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name, duration } = req.body;
  let imageUrl = '';

  const client = await Clients.findById(id);

  if (req.file) {
    if (client.image) {
      const oldImageRef = ref(storage, client.image);
      await deleteObject(oldImageRef);
    }

    const timestamp = Date.now();
    const imageName = `${timestamp}_${req.file.originalname}`;

    const imageRef = ref(storage, `images/${imageName}`);
    await uploadBytes(imageRef, req.file.buffer);
    imageUrl = await getDownloadURL(imageRef);
  } else {
    imageUrl = client.image;
  }

  const updatedClient = await Clients.findByIdAndUpdate(id, { name, image: imageUrl, duration }, { new: true });
  res.send(updatedClient);
});

app.delete('/clients/:id', async (req, res) => {
  const { id } = req.params;
  const client = await Clients.findByIdAndDelete(id);
  if (client) {
    const imageRef = ref(storage, client.image);
    deleteObject(imageRef)
      .then(() => {
        res.send({ message: 'Client and image deleted successfully' });
      })
      .catch((error) => {
        res.status(500).send({ message: 'Error deleting image from Firebase', error });
      });
  } else {
    res.status(404).send({ message: 'Client not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
