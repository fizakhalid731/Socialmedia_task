const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const User = require("./model/usermodel.js");
const jwt = require("jsonwebtoken");
const userposts = require("./model/userposts.js");

const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');


const app = express();


const port = 5000;
const secretKey = "mykey";

// app.use(bodyParser.json());
app.use(express.json());
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));



// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/projectdatabse", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("MongoDB connection succeeded"))
    .catch((error) => console.error("Connection error:", error));


    const transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: 'Replace with your email', // Replace with your email
            pass: 'Replace with your email password'    // Replace with your email password or app-specific password
        }
    });

 const transporters = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: 'Replace with your email', // Replace with your email
            pass: 'Replace with your email password'    // Replace with your email password or app-specific password
        }
    });
app.use('/uploads', express.static('uploads'));


const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
      cb(null, 'uploads/');
    },
    filename: (req, file, cb)=>{
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
    }
});

const upload = multer({
    storage: storage
});

app.get("/signupusers", async (req, res) => {
    const users = await User.find({});
    res.json(users);
});


app.post("/sign_up", async (req, res) => {
   
    const { name,username, email, password } = req.body;
    console.log(req.body);
    
    
    const otp = Math.floor(100000 + Math.random() * 900000);

    const useralreadyexist= await User.findOne({username});
    if(useralreadyexist){
        return res.status(400).json({message: "Username already Exist"})
    }
 
    const newUser = new User({
        name,
        username,
        email,
        password,
        otp
    });


await newUser.save();
    console.log("Record inserted Successfully");

    const mailOptions = {
        from: 'fizakhalid.14dev@gmail.com',
        to: email,
        subject: 'Confirm your account with OTP',
        text: `Your OTP code is: ${otp}`
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({message: "signup successfull"})
 
});


app.post('/verify-otp', async (req, res) => {
const { email, otp } = req.body;

try {
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).send({ error: 'User not found.' });
    }

    if (user.otp === otp) {
       
        user.otp = null; 
        user.isVerified = true; 
        await user.save();

        res.status(200).send({ message: 'OTP verified! You can now log in.' });
    } else {
        res.status(400).send({ error: 'Invalid OTP.' });
    }
} catch (error) {
    res.status(500).send({ error: 'Error verifying OTP.' });
}
});

//forget password
app.post('/reset-password-req', async (req, res) => {
   
    const { email} = req.body;
    console.log(req.body);
   
    const user= await User.findOne({email});
    if(!user){
        return res.status(404).json({message: "User not found"})
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.forget_otp = otp; // Assign the new OTP
    await user.save();

  
    const mailOptions = {
        from: 'fizakhalid.14dev@gmail.com',
        to: email,
        subject: 'Reset Password OTP',
        text: `Your OTP for reset password is: ${otp}`
    };

    await transporters.sendMail(mailOptions);
    return res.status(200).json({message: "OTP sent successfully"})
 
});


app.post('/verify-forget-otp', async (req, res) => {
    console.log("Received data:", req.body);
    const { email, forget_otp } = req.body;

    if (!email || !forget_otp) {
        return res.status(400).send({ error: 'Email and OTP are required.' });
    }
    try {
        const user = await User.findOne({ email });
    
        if (!user) {
            return res.status(404).send({ error: 'User not found.' });
        }
    
        if (user.forget_otp == forget_otp) {
           
            user.forget_otp = null; 
            user.isVerified = true;
            await user.save();
    
            res.status(200).send({ message: 'OTP verified! You can now log in.' });
        } else {
            res.status(400).send({ error: 'Invalid OTP.' });
        }
    } catch (error) {
        res.status(500).send({ error: 'Error verifying OTP.' });
    }
    });

app.post('/reset-password',async (req, res) =>{
    try{
    const {email, newPassword } = req.body;
    const user= await User.findOne({email});
    if(!user){
        return res.status(404).json({message: "User not found"})
    }
    user.password = newPassword;
    await user.save();
    return res.status(200).json({message: 'Password reset successful'})
    }catch (error){
        return res.status(500).json({ message: "Internal server error", error: error.message }); 
    }

})





app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
         console.log(req.body)
        // Check if the user exists
        const loginUser = await User.findOne({ username });
        if (!loginUser) {
            return res.status(401).json({ message: "User not found" });
        }
      if(loginUser.password !== password){
        return res.status(401).json({ message: "Invalid password" });
      }
       
        // Generate a token
        const token = jwt.sign({username: loginUser.username }, secretKey, { expiresIn: "1h" });

        // Store the token in local storage on the client-side (handled by frontend)
        return res.status(200).json({
            message: `User login successfully. Welcome, ${username}`,
            token,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Login error" });
    }
});


// Serve the home page
app.get("/", (req, res) => {
    res.set({
        "Access-Control-Allow-Origin": "*",
    });
    res.sendFile(__dirname + "/signup.html");
});

// Serve the login page
app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/login.html");
});


///////////////
function authenticate(req,res,next){
    let token = req.headers.token;
    if(!token){
      return res.status(401).json({
        message:"Not logged In."
      })
    }
    jwt.verify(token, secretKey, function(err, decoded){
        if(err){
            return res.status(403).json({
                message: "Invalid token!"
            });
        }
        req.user = decoded;
        next();
    });
  
  }

app.get('/loggedIn-user-posts', authenticate, async (req, res) => {
   
        const loggedUser = req.user.username;
        const userPosts = await userposts.find({ username: loggedUser });

        if (userPosts.length === 0) {
            return res.status(404).json({ message: "This user has no posts." });
        }
        return res.status(200).json({ message: `${loggedUser}'s Posts`, userPosts });
    
});
app.delete('/deleteUser',authenticate, async (req, res) => {
    const loggedUser = req.user.username;
    const deleteuser = await User.findOneAndDelete({username: loggedUser});
        const postsdelete = await userposts.deleteMany({username: loggedUser});
    
        if (!deleteuser) {
            return res.status(404).json({ message: "User not found" });
        }
        if(postsdelete.deletedCount === 0){
            return res.status(404).json({ message: "Users post not found" });
        }

        res.status(200).json({ message: "User account delete successfully", deleteuser, postsdelete});
       
  
});



app.post('/uploadpost', authenticate, upload.single('image'),  async (req, res) => {
   
        const { title, description } = req.body;
        const loggedUser = req.user.username; 
        const imagePath = req.file.path;

        const newPost = new userposts({
            title,
            description,
            username: loggedUser,
            image: imagePath, 
        });

        
    const postsave = await newPost.save();
    if(postsave){
        return res.status(201).json({ message: "Post uploaded successfully!" });
    }
    return res.status(500).json({ message: "An error occurred while uploading the post." });
   
});


app.post('/upload-csv',authenticate, upload.single('csvFile'), async (req, res) =>{
    if(!req.file){
        return res.status(400).send('no file uploaded');
    }

    const result = [];
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    const loggedUser = req.user.username; 

    fs.createReadStream(filePath)
    .pipe(csv())
    .on('data',(data)=>{
        if(!data.title || !data.description || !data.image){
            return res.status(400).send('Title, description, and image path are required in the CSV.');
        }

        result.push({
            title: data.title,
            description: data.description,
            image: data.image,
            username: loggedUser,
        });
    })
    .on('end', async ()=>{

        await userposts.insertMany(result);
        console.log(result);
        fs.unlinkSync(filePath);

        res.status(200).send('CSV uploaded and processed successfully.');
    })
    .on('error', (error) => {
        console.error(error);
        res.status(500).send('Error reading CSV file.');
    });
})



app.get('/other-user-posts', authenticate, async (req, res) => {
   
    const loggedUser = req.user.username;
    const userPosts = await userposts.find({ username: {$ne: loggedUser} });

    if (userPosts.length === 0) {
        return res.status(404).json({ message: " no posts available" });
    }
    return res.status(200).json({ posts: userPosts });

});




app.put('/updateprofile', authenticate, async(req,res)=>{
   
    
    const { name,username, email, password}= req.body;
    const loggedUser = req.user.username;

    const uplateuserinfo = await User.findOneAndUpdate(
        {username: loggedUser},
        {name,username, email,password},
        {new: true}
    );

    if(!uplateuserinfo){
        return res.status(404).json({message: "user not found"});
    }

    return res.status(200).json({message: "user profile update successfully",user: uplateuserinfo});
})

app.get('/getprofileinfo',authenticate,async(req, res)=>{
    const loggedUser = req.user.username;
    const userinfo = await User.findOne({username: loggedUser});
    if(userinfo){
        return res.status(200).json({user:{ name: userinfo.name,username: userinfo.username, email: userinfo.email}});
    }
    return res.status(404).json({message: "user not found"})
})


app.put('/updatePost/:id',upload.single('image'), async (req, res) => {
    const { title, description } = req.body;
    const id = req.params.id; 
    const objectId = new mongoose.Types.ObjectId(id);
    // const imagePath = req.file.path;
    
    const updateData =  {title, description};

    if(req.file){
        updateData.image = req.file.path
    }
        const updatedPost = await userposts.findByIdAndUpdate(
            objectId,
            updateData,
            {
                new: true
            }
        );

        if (!updatedPost) {
            return res.status(404).json({ message: "Post not found" });
        }

        res.status(200).json({ message: "Post updated successfully", updatedPost });
});

//delete post
app.delete('/deletePost/:id', async (req, res) => {
    const id = req.params.id; 
    const objectId = new mongoose.Types.ObjectId(id);
    
        const deletePost = await userposts.findByIdAndDelete(
            objectId
        );

        if (!deletePost) {
            return res.status(404).json({ message: "Post not found" });
        }

        res.status(200).json({ message: "Post delete successfully", deletePost });
       
  
});


app.post('/like/:id', authenticate, async (req, res) => {
    const loggedUser = req.user.username;
    const postId = req.params.id;

    // Find the post by ID
    const findpost = await userposts.findById(postId);
    if (!findpost) {
        return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user has already liked the post
    const alreadyLiked = findpost.likes.includes(loggedUser);

    if (alreadyLiked) {
        // Remove like
        findpost.likes = findpost.likes.filter((username) => username !== loggedUser);
    } else {
        // Add like
        findpost.likes.push(loggedUser);
    }

    // Save the post with the updated likes
    await findpost.save();

    // Respond with the updated like status and count
    res.status(200).json({ liked: !alreadyLiked, likesCount: findpost.likes.length });
});

app.get('/post-likes', authenticate, async (req, res) =>{
    const loggedUser = req.user.username;
    try{
    const user_post = await userposts.find(loggedUser);
    const totallikes = user_post.reduce((acc, upost) => acc + upost.likes.length, 0);
   
    return res.status(200).json({user_post, totallikes});
    }catch (error){
        res.status(500).json({ message: 'Server error' });
    }
})





app.post('/comment/:postId', authenticate, async (req, res) => {
    try {
      const { postId } = req.params;
      const { comment } = req.body;
      const username = req.user.username; 
  
     
      if (!comment || !postId) {
        return res.status(400).json({ message: 'Comment and post ID are required' });
      }
  
     
      const post = await userposts.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
  
    
      post.comments.push({ username, text: comment });
      await post.save();
  
      res.status(200).json({ username, comment });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  

  app.get('/comments/:postId', authenticate, async (req, res) => {
    try {
      const { postId } = req.params;
  
      // Check if postId is provided
      if (!postId) {
        return res.status(400).json({ message: 'Post ID is required' });
      }
  
      // Find the post by ID
      const post = await userposts.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
  
      // Send the comments associated with the post
      res.status(200).json({ comments: post.comments });
    } catch (error) {
      console.error('Error retrieving comments:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
