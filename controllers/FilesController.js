// Filecontroller endpoint description
const { v4: uuidV4 } = require('uuid');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const mime = require('mime-types');
const mongo = require('../utils/db');
const redistClient = require('../utils/redis');

const FilesController = {
  async postUpload(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redistClient.get(key);
    const { name, type, data } = req.body;
    let { parentId, isPublic } = req.body;

    if (!isPublic) {
      isPublic = false;
    }
    // const parentId = 0;
    // const { isPublic } = req.body || false;
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';

    if (userId) {
      // try{
      const user = await mongo.getUserById(userId);
      if (user) {
        try {
          if (!name) {
            res.status(400).json({ error: 'Missing name' }).end();
          } else if (!type) {
            res.status(400).json({ error: 'Missing type' }).end();
          } else if (type !== 'folder' && !data) {
            res.status(400).json({ error: 'Missing data' }).end();
            // } else if (parentId) {
          }
          if (parentId) {
            const parentFile = await mongo.getParentFile(parentId);
            if (!parentFile) {
              res.status(400).json({ error: 'Parent not found' }).end();
            } else if (parentFile.type !== 'folder') {
              res.status(400).json({ error: 'Parent is not a folder' }).end();
            }
          } else {
            parentId = 0;
          }
          const fileName = uuidV4();
          const absPath = `${folderPath}/${fileName}`;
          if (parentId !== 0) {
            parentId = ObjectId(parentId);
          }
          const userID = ObjectId(userId);
          // Add file to database
          const fileId = await mongo.addFile(
            userID,
            name,
            type,
            isPublic,
            parentId,
            absPath,
          );

          // Save file to disk
          if (type !== 'folder') {
            fs.mkdirSync(folderPath, { recursive: true });
            const decodedData = Buffer.from(data, 'base64').toString('binary');
            fs.writeFile(absPath, decodedData, (error) => {
              if (error) {
                console.error(error);
              }
            });
          }

          // const file = await mongo.getFileById(fileId);

          res
            .status(201)
            .json({
              id: fileId,
              userId,
              name,
              type,
              isPublic,
              parentId,
            })
            .end();
        } catch (error) {
          console.error(error);
        }
      } else {
        res.status(401).json({ error: 'Unauthorized' });
      }
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  },

  // Getshow function endpoint
  async getShow(req, res) {
    const token = req.headers['x-token'];
    const { id } = req.params;

    // console.log(id);

    const key = `auth_${token}`;
    const userId = await redistClient.get(key);
    if (userId) {
      const user = await mongo.getUserById(userId);
      if (user) {
        try {
          const file = await mongo.getFileById(id);
          if (!file) {
            res.status(404).json({ error: 'Not found' }).end();
          } else if (file.userId.toString() !== userId) {
            res.status(404).json({ error: 'Not found' }).end();
          } else {
            res.status(200).json(file).end();
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        res.status(401).json({ error: 'Unauthorized' }).end();
      }
    } else {
      res.status(401).json({ error: 'Unauthorized' }).end();
    }
  },

  // Get index function endpoint with pagination
  async getIndex(req, res) {
    const token = req.headers['x-token'];
    const { page } = req.query || 0;
    const parentId = req.query.parentId || 0;
    const key = `auth_${token}`;
    const userId = await redistClient.get(key);
    if (userId) {
      const user = await mongo.getUserById(userId);
      if (user) {
        try {
          const files = await mongo.getFilesByUserId(userId, page, parentId);
          if (!files) {
            res.status(404).json({ error: 'Not found' }).end();
          } else {
            res.status(200).json(files).end();
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        res.status(401).json({ error: 'Unauthorized' }).end();
      }
    } else {
      res.status(401).json({ error: 'Unauthorized' }).end();
    }
  },

  // Put publish function endpoint
  async putPublish(req, res) {
    const token = req.headers['x-token'];
    const { id } = req.params;
    const key = `auth_${token}`;
    const userId = await redistClient.get(key);
    if (userId) {
      const user = await mongo.getUserById(userId);
      if (user) {
        try {
          const file = await mongo.getFileById(id);
          if (!file) {
            res.status(404).json({ error: 'Not found' }).end();
          } else if (file.userId.toString() !== userId) {
            res.status(404).json({ error: 'Not found' }).end();
          } else {
            // const isPublic =
            await mongo.publishFile(id);
            // console.log(isPublic);
            const updatedFile = await mongo.getFileById(id);
            res.status(200).json(updatedFile).end();
          }
        } catch (error) {
          console.error(error);
        }
      }
    } else {
      res.status(401).json({ error: 'Unauthorized' }).end();
    }
  },

  // Put unpublish function endpoint
  async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    const { id } = req.params;
    const key = `auth_${token}`;
    const userId = await redistClient.get(key);
    if (userId) {
      const user = await mongo.getUserById(userId);
      if (user) {
        try {
          const file = await mongo.getFileById(id);
          if (!file) {
            res.status(404).json({ error: 'Not found' }).end();
          } else if (file.userId.toString() !== userId) {
            res.status(404).json({ error: 'Not found' }).end();
          } else {
            // const isNotPublic =
            await mongo.unPublishFile(id);
            // console.log(isNotPublic);
            const updatedFile = await mongo.getFileById(id);
            res.status(200).json(updatedFile).end();
          }
        } catch (error) {
          console.error(error);
        }
      }
    } else {
      res.status(401).json({ error: 'Unauthorized' }).end();
    }
  },

  // Get file data function endpoint
  async getFile(req, res) {
    const token = req.headers['x-token'];
    const { id } = req.params;
    const key = `auth_${token}`;
    const userId = await redistClient.get(key);
    const file = await mongo.getFileById(id);
    if (file) {
      if (userId && file.userId.toString() !== userId) {
        res.status(404).json({ error: 'Not found' }).end();
      }

      if (file.isPublic === false) {
        if (!userId || file.userId.toString() !== userId) {
          res.status(404).json({ error: 'Not found' }).end();
        }
      }

      // check that file is not a folder
      if (file.type === 'folder') {
        res.status(400).json({ error: "A folder doesn't have content" }).end();
      }

      // raise error if file does not exist locally
      if (!fs.existsSync(file.absPath)) {
        res.status(404).json({ error: 'Not found' }).end();
      }

      // check the type of file from the name using mime-types
      const fileType = mime.lookup(file.name);

      // read file and send it back
      try {
        const data = fs.readFileSync(file.absPath, 'utf-8');
        if (userId === file.userId.toString()) {
          res.setHeader('Content-Type', fileType);
          res.status(200).json(data).end();
        }
        res.status(200).json(data).end();
      } catch (error) {
        console.error(error);
      }
    } else {
      res.status(404).json({ error: 'Not found' }).end();
    }
  },
};

module.exports = FilesController;
