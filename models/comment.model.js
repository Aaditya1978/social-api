const mongoose = require("mongoose");

const Comment = new mongoose.Schema(
    {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            index: true,
            required: true,
            auto: true,
        },
        comment: {
            type: String,
            required: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true,
        },
        created_at: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    { collection: "comment" }
);

const model = mongoose.model("Comment", Comment);

module.exports = model;