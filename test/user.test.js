const mongoose = require("mongoose");
const Post = require("../models/post.model");
const Comment = require("../models/comment.model");
const User = require("../models/user.model");
const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../app");
const should = chai.should();
const bcrypt = require("bcrypt");

const saltRounds = parseInt(process.env.SALT_ROUNDS);

const testUser = {
  email: "test@gmail.com",
  password: "test",
};

chai.use(chaiHttp);

describe("UserTest", () => {
  beforeEach((done) => {
    User.deleteMany({}, (err) => {
      const user1 = new User({
        id: mongoose.Types.ObjectId("5f1b1b1b1b1b1b1b1b1b1b1b"),
        name: "test",
        email: "test@gmail.com",
        password: bcrypt.hashSync("test", saltRounds),
      });
      user1.save((err, user) => {
        const user2 = new User({
          id: mongoose.Types.ObjectId("5f1b1b1b1b1b1b1b1b1b1b1c"),
          name: "test2",
          email: "test2@gmail.com",
          password: bcrypt.hashSync("test2", saltRounds),
        });
        user2.save((err, user2) => {
          done();
        });
      });
    });
    // create users
  });

  // Test to authenticate a user
  describe("/POST authenticate", () => {
    it("it should authenticate a user", (done) => {
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("token");
          done();
        });
    });
  });

  // test to authenticate with wrong password
  describe("/POST authenticate 2", () => {
    it("it should not authenticate user", (done) => {
      let user = {
        email: "test@gmail.com",
        password: "test2",
      };
      chai
        .request(server)
        .post("/api/authenticate")
        .send(user)
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a("object");
          res.body.should.have.property("error");
          done();
        });
    });
  });

  // test to follow a user
  describe("/POST follow", () => {
    it("it should follow a user", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then follow
          chai
            .request(server)
            .post("/api/follow/5f1b1b1b1b1b1b1b1b1b1b1c")
            .send({ token: token })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("object");
              done();
            });
        });
    });
  });

  // test to follow a user already followed
  describe("/POST follow2", () => {
    it("it should return already followed", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then follow
          chai
            .request(server)
            .post("/api/follow/5f1b1b1b1b1b1b1b1b1b1b1c")
            .send({ token: token })
            .end((err, res) => {
              res.should.have.status(200);
              chai
                .request(server)
                .post("/api/follow/5f1b1b1b1b1b1b1b1b1b1b1c")
                .send({ token: token })
                .end((err, res) => {
                  res.should.have.status(400);
                  res.body.should.be.a("object");
                  done();
                });
            });
        });
    });
  });

  // test to unfollow a user
  describe("/POST unfollow", () => {
    it("it should unfollow a user", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then follow
          chai
            .request(server)
            .post("/api/follow/5f1b1b1b1b1b1b1b1b1b1b1c")
            .send({ token: token })
            .end((err, res) => {
              res.should.have.status(200);
              chai
                .request(server)
                .post("/api/unfollow/5f1b1b1b1b1b1b1b1b1b1b1c")
                .send({ token: token })
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a("object");
                  done();
                });
            });
        });
    });
  });

  //   test to unfollow user which is not followed
  describe("/POST unfollow2", () => {
    it("it should return not followed", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then unfollow
          chai
            .request(server)
            .post("/api/unfollow/5f1b1b1b1b1b1b1b1b1b1b1c")
            .send({ token: token })
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.be.a("object");
              done();
            });
        });
    });
  });

  //   test to get user profile
  describe("/GET profile", () => {
    it("it should get user profile", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then get profile
          chai
            .request(server)
            .get("/api/user")
            .set("Authorization", "Bearer " + token)
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("object");
              done();
            });
        });
    });
  });

  //   test to get user profile with wrong token
  describe("/GET profile2", () => {
    it("it should not get user profile", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then get profile
          chai
            .request(server)
            .get("/api/user")
            .set("Authorization", "Bearer " + token + "2")
            .end((err, res) => {
              res.should.have.status(500);
              res.body.should.be.a("object");
              done();
            });
        });
    });
  });

  //   test to create a post
  describe("/POST post", () => {
    it("it should create a post", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then create a post
          chai
            .request(server)
            .post("/api/posts")
            .send({ token: token, title: "test post", desc: "test desc" })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("object");
              done();
            });
        });
    });
  });

  // test to create a post with missing desc
  describe("/POST post2", () => {
    it("it should not create a post", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then create a post
          chai
            .request(server)
            .post("/api/posts")
            .send({ token: token, title: "test post" })
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.be.a("object");
              done();
            });
        });
    });
  });

  //   test to delete a post
  describe("/DELETE post", () => {
    it("it should delete a post", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then create a post
          chai
            .request(server)
            .post("/api/posts")
            .send({ token: token, title: "test post", desc: "test desc" })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("object");
              // then delete a post
              chai
                .request(server)
                .delete("/api/posts/" + res.body.post_id)
                .send({ token: token })
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a("object");
                  done();
                });
            });
        });
    });
  });

  //   test to delete a post which is not created by user
  describe("/DELETE post2", () => {
    it("it should not delete a post", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then create a post
          chai
            .request(server)
            .post("/api/posts")
            .send({ token: token, title: "test post", desc: "test desc" })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("object");
              // then delete a post
              chai
                .request(server)
                .delete("/api/posts/" + res.body.post_id)
                .send({ token: token + "2" })
                .end((err, res) => {
                  res.should.have.status(500);
                  res.body.should.be.a("object");
                  done();
                });
            });
        });
    });
  });

  //   test to like a post
  describe("/POST like", () => {
    it("it should like a post", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then create a post
          chai
            .request(server)
            .post("/api/posts")
            .send({ token: token, title: "test post", desc: "test desc" })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("object");
              // then like a post
              chai
                .request(server)
                .post("/api/like/" + res.body.post_id)
                .send({ token: token })
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a("object");
                  done();
                });
            });
        });
    });
  });

  //   test to like a post which is already liked by user
  describe("/POST like2", () => {
    it("it should not like a post", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then create a post
          chai
            .request(server)
            .post("/api/posts")
            .send({ token: token, title: "test post", desc: "test desc" })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("object");
              // then like a post
              chai
                .request(server)
                .post("/api/like/" + res.body.post_id)
                .send({ token: token })
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a("object");
                  // then like a post again
                  chai
                    .request(server)
                    .post("/api/like/" + res.body.post_id)
                    .send({ token: token })
                    .end((err, res) => {
                      res.should.have.status(500);
                      res.body.should.be.a("object");
                      done();
                    });
                });
            });
        });
    });
  });

  //   test to unlike a post
  describe("/POST unlike", () => {
    it("it should unlike a post", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then create a post
          chai
            .request(server)
            .post("/api/posts")
            .send({ token: token, title: "test post", desc: "test desc" })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("object");
              const post_id = res.body.post_id;
              // then like a post
              chai
                .request(server)
                .post("/api/like/" + post_id)
                .send({ token: token })
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a("object");
                  // then unlike a post
                  chai
                    .request(server)
                    .post("/api/unlike/" + post_id)
                    .send({ token: token })
                    .end((err, res) => {
                      res.should.have.status(200);
                      res.body.should.be.a("object");
                      done();
                    });
                });
            });
        });
    });
  });

  // test to unlike a post which is not liked by user
  describe("/POST unlike2", () => {
    it("it should not unlike a post", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then create a post
          chai
            .request(server)
            .post("/api/posts")
            .send({ token: token, title: "test post", desc: "test desc" })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("object");
              // then unlike a post
              chai
                .request(server)
                .post("/api/unlike/" + res.body.post_id)
                .send({ token: token })
                .end((err, res) => {
                  res.should.have.status(400);
                  res.body.should.be.a("object");
                  done();
                });
            });
        });
    });
  });

  //   test to comment on a post
  describe("/POST comment", () => {
    it("it should comment on a post", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then create a post
          chai
            .request(server)
            .post("/api/posts")
            .send({ token: token, title: "test post", desc: "test desc" })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("object");
              // then comment on a post
              chai
                .request(server)
                .post("/api/comment/" + res.body.post_id)
                .send({ token: token, comment: "test comment" })
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a("object");
                  done();
                });
            });
        });
    });
  });

  // test to comment on a post with empty comment
  describe("/POST comment2", () => {
    it("it should not comment on a post", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then create a post
          chai
            .request(server)
            .post("/api/posts")
            .send({ token: token, title: "test post", desc: "test desc" })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("object");
              // then comment on a post
              chai
                .request(server)
                .post("/api/comment/" + res.body.post_id)
                .send({ token: token, comment: "" })
                .end((err, res) => {
                  res.should.have.status(400);
                  res.body.should.be.a("object");
                  done();
                });
            });
        });
    });
  });

  // test to get a post by id
  describe("/GET post", () => {
    it("it should get a post by id", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then create a post
          chai
            .request(server)
            .post("/api/posts")
            .send({ token: token, title: "test post", desc: "test desc" })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("object");
              // then get a post
              chai
                .request(server)
                .get("/api/posts/" + res.body.post_id)
                .set("Authorization", "Bearer " + token)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a("object");
                  done();
                });
            });
        });
    });
  });

  // to get a post with wrong id
  describe("/GET post2", () => {
    it("it should not get a post by id", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then get a post
          chai
            .request(server)
            .get("/api/posts/5f2d9b1d3b3e3d2e8c2b2e1d")
            .set("Authorization", "Bearer " + token)
            .end((err, res) => {
              res.should.have.status(404);
              res.body.should.be.a("object");
              done();
            });
        });
    });
  });

  // test to get all posts of a user
  describe("/GET all posts", () => {
    it("it should get all posts of a user", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then create a post
          chai
            .request(server)
            .post("/api/posts")
            .send({ token: token, title: "test post", desc: "test desc" })
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("object");
              // then get all posts
              chai
                .request(server)
                .get("/api/all_posts")
                .set("Authorization", "Bearer " + token)
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a("array");
                  done();
                });
            });
        });
    });
  });

  //   test to get all posts of a user with wrong token
  describe("/GET all posts2", () => {
    it("it should not get all posts of a user", (done) => {
      // first authenticate
      chai
        .request(server)
        .post("/api/authenticate")
        .send(testUser)
        .end((err, res) => {
          res.body.should.have.property("token");
          let token = res.body.token;
          // then get all posts
          chai
            .request(server)
            .get("/api/all_posts")
            .set("Authorization", "Bearer " + token + "1")
            .end((err, res) => {
              res.should.have.status(500);
              res.body.should.be.a("object");
              done();
            });
        });
    });
  });
});
