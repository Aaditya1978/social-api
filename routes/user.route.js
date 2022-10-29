const express = require("express");
const Router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const Post = require("../models/post.model");
const Comment = require("../models/comment.model");

const saltRounds = parseInt(process.env.SALT_ROUNDS);

// route to create a new user
Router.post("/register", async (req, res) => {
  if (!req.body.name || !req.body.email || !req.body.password) {
    return res.status(400).json({
      message: "Please enter all fields",
    });
  }

  const { name, email, password } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    return res.status(400).send({ error: "User already exists" });
  }
  bcrypt.hash(password, saltRounds, async (err, hash) => {
    if (err) {
      console.log(err);
      return res.status(500).send({ error: "Internal server error" });
    }
    try {
      const newUser = await User.create({ name, email, password: hash });
      return res.status(201).send("User created successfully");
    } catch (err) {
      return res.status(500).send({ error: "Internal server error" });
    }
  });
});

// route to authenticate a user
Router.post("/authenticate", async (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({
      message: "Please enter all fields",
    });
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).send({ error: "User not found" });
  }

  bcrypt.compare(password, user.password, async (err, result) => {
    if (err) {
      return res.status(500).send({ error: "Internal server error" });
    }
    if (!result) {
      return res.status(401).send({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "6h",
    });
    return res.status(200).send({ token: token });
  });
});

// route to get user profile
Router.get("/user", async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
        return res.status(401).send({ error: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ id: decoded.id });
        const user_data = {
            name: user.name,
            no_of_followers: user.followers.length,
            no_of_following: user.following.length,
        }
        return res.status(200).send(user_data);
    } catch (err) {
        return res.status(500).send({ error: "Internal server error" });
    }
});


// router to follow a user
Router.post("/follow/:id", async (req, res) => {
  const { id } = req.params;
  const { token } = req.body;
  if (!token) {
    return res.status(401).send({ error: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ id: decoded.id });
    if (!user) {
      return res.status(404).send({ error: "Unauthorized" });
    }
    const userToFollow = await User.findOne({ id });
    if (!userToFollow) {
      return res.status(404).send({ error: "User not found" });
    }
    if (user.following.includes(id)) {
        return res.status(400).send({ error: "Already following" });
    }
    user.following.push(userToFollow.id);
    userToFollow.followers.push(user.id);
    await user.save();
    await userToFollow.save();
    return res.status(200).send("User Followed successfully");
  } catch (err) {
    return res.status(500).send({ error: "Internal server error" });
  }
});

// route to unfollow a user
Router.post("/unfollow/:id", async (req, res) => {
    const { id } = req.params;
    const { token } = req.body;
    if (!token) {
        return res.status(401).send({ error: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ id: decoded.id });
        if (!user) {
        return res.status(404).send({ error: "Unauthorized" });
        }
        const userToUnfollow = await User.findOne({ id });
        if (!userToUnfollow) {
        return res.status(404).send({ error: "User not found" });
        }
        if (!user.following.includes(id)) {
            return res.status(400).send({ error: "Not following" });
        }
        const index = user.following.indexOf(id);
        user.following.splice(index, 1);
        const index2 = userToUnfollow.followers.indexOf(user.id);
        userToUnfollow.followers.splice(index2, 1);
        await user.save();
        await userToUnfollow.save();
        return res.status(200).send("User Unfollowed successfully");
    } catch (err) {
        return res.status(500).send({ error: "Internal server error" });
    }
});

// route for adding a post
Router.post("/posts", async (req, res) => {
    const { token, title, desc } = req.body;
    if (!token) {
        return res.status(401).send({ error: "Unauthorized" });
    }
    if (!title || !desc) {
        return res.status(400).send({ error: "Please enter all fields" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ id: decoded.id });
        if (!user) {
            return res.status(404).send({ error: "Unauthorized" });
        }
        const newPost = await Post.create({ title, desc, author: user.id });
        user.posts.push(newPost.id);
        await user.save();
        return res.status(200).send({
            post_id: newPost.id,
            title: newPost.title,
            desc: newPost.desc,
            created_at: newPost.created_at.toUTCString(),
        });
    }
    catch (err) {
        return res.status(500).send({ error: "Internal server error" });
    }
});

// route to delete a post
Router.delete("/posts/:id", async (req, res) => {
    const { id } = req.params;
    const { token } = req.body;
    if (!token) {
        return res.status(401).send({ error: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ id: decoded.id });
        if (!user) {
            return res.status(404).send({ error: "Unauthorized" });
        }
        const post = await Post.findOne({ id });
        if (!post) {
            return res.status(404).send({ error: "Post not found" });
        }
        if(String(post.author) !== String(user.id)) {
            return res.status(401).send({ error: "Unauthorized" });
        }
        await post.delete();
        return res.status(200).send("Post deleted successfully");
    }
    catch (err) {
        return res.status(500).send({ error: "Internal server error" });
    }
});

// route to like a post
Router.post("/like/:id", async (req, res) => {
    const { id } = req.params;
    const { token } = req.body;
    if (!token) {
        return res.status(401).send({ error: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ id: decoded.id });
        if (!user) {
            return res.status(404).send({ error: "Unauthorized" });
        }
        const post = await Post.findOne({ id });
        if (!post) {
            return res.status(404).send({ error: "Post not found" });
        }
        if (post.likes.includes(user.id)) {
            return res.status(400).send({ error: "Already liked" });
        }
        post.likes.push(user.id);
        await post.save();
        return res.status(200).send("Post liked successfully");
    }
    catch (err) {
        return res.status(500).send({ error: "Internal server error" });
    }
});

// route to unlike a post
Router.post("/unlike/:id", async (req, res) => {
    const { id } = req.params;
    const { token } = req.body;
    if (!token) {
        return res.status(401).send({ error: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ id: decoded.id });
        if (!user) {
            return res.status(404).send({ error: "Unauthorized" });
        }
        const post = await Post.findOne({ id });
        if (!post) {
            return res.status(404).send({ error: "Post not found" });
        }
        if (!post.likes.includes(user.id)) {
            return res.status(400).send({ error: "Not liked" });
        }
        const index = post.likes.indexOf(user.id);
        post.likes.splice(index, 1);
        await post.save();
        return res.status(200).send("Post unliked successfully");
    }
    catch (err) {
        return res.status(500).send({ error: "Internal server error" });
    }
});

// route to comment on a post
Router.post("/comment/:id", async (req, res) => {
    const { id } = req.params;
    const { token, comment } = req.body;
    if (!token) {
        return res.status(401).send({ error: "Unauthorized" });
    }
    if (!comment || comment.length < 1) {
        return res.status(400).send({ error: "Please enter all fields" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ id: decoded.id });
        if (!user) {
            return res.status(404).send({ error: "Unauthorized" });
        }
        const post = await Post.findOne({ id });
        if (!post) {
            return res.status(404).send({ error: "Post not found" });
        }
        const newComment = await Comment.create({ comment, author: user.id, post: post.id });
        post.comments.push(newComment.id);
        await post.save();
        return res.status(200).send({
            comment_id: newComment.id,
        });
    }
    catch (err) {
        return res.status(500).send({ error: "Internal server error" });
    }
});


// route to get a post with id
Router.get("/posts/:id", async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
        return res.status(401).send({ error: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ id: decoded.id });
        if (!user) {
            return res.status(404).send({ error: "Unauthorized" });
        }
        const post = await Post.findOne({ id });
        if (!post) {
            return res.status(404).send({ error: "Post not found" });
        }
        const author = await User.findOne({ id: post.author });
        const comments = await Comment.find({ post: post.id });
        const commentsList = [];
        for (let i = 0; i < comments.length; i++) {
            commentsList.push(comments[i].comment);
        }
        return res.status(200).send({
            post_id: post.id,
            title: post.title,
            desc: post.desc,
            author: author.name,
            created_at: post.created_at.toUTCString(),
            likes: post.likes.length,
            comments: commentsList,
        });
    }
    catch (err) {
        return res.status(500).send({ error: "Internal server error" });
    }
});


// route to get all posts
Router.get("/all_posts", async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
        return res.status(401).send({ error: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ id: decoded.id });
        if (!user) {
            return res.status(404).send({ error: "Unauthorized" });
        }
        // find all posts with user as author, sort by created_at
        const posts = await Post.find({ author: user.id }).sort({ created_at: -1 });
        const postsList = [];
        for (let i = 0; i < posts.length; i++) {
            const comments = await Comment.find({ post: posts[i].id });
            const commentsList = [];
            for (let j = 0; j < comments.length; j++) {
                commentsList.push(comments[j].comment);
            }
            postsList.push({
                post_id: posts[i].id,
                title: posts[i].title,
                desc: posts[i].desc,
                created_at: posts[i].created_at.toUTCString(),
                likes: posts[i].likes.length,
                comments: commentsList,
            });
        }
        return res.status(200).send(postsList);
    }
    catch (err) {
        return res.status(500).send({ error: "Internal server error" });
    }
});


module.exports = Router;
