const mongoose = require("mongoose");

const Post = new mongoose.Schema(
    {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            index: true,
            required: true,
            auto: true,
        },
        title: {
            type: String,
            required: true,
        },
        desc: {
            type: String,
            required: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        created_at: {
            type: Date,
            required: true,
            default: Date.now,
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        comments: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
        }],
    },
    { collection: "post" }
);

const model = mongoose.model("Post", Post);

module.exports = model;