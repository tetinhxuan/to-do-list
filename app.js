const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { render } = require("ejs");
const _ = require("lodash");

const app = express();

const url =
  "mongodb+srv://iceland10298:quan12345@cluster0.26y0vhz.mongodb.net/todoListDB";
mongoose.set("strictQuery", false);
mongoose.connect(url, () => {
  console.log("set database success!");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const todoListSchema = new mongoose.Schema({
  task: String,
});
const TodoList = mongoose.model("TodoList", todoListSchema);

const item1 = TodoList({
  task: "Wellcome to your todoList!!",
});
const item2 = TodoList({
  task: "Hit the + button to add a new task.",
});
const item3 = TodoList({
  task: "<-- Hit this to delete task.",
});
const initialItems = [item1, item2, item3];

// const for the custom page
const listSchema = {
  name: String,
  items: [todoListSchema],
};

const List = mongoose.model("List", listSchema);

//get defautl page
app.get("/", function (req, res) {
  TodoList.find({}, function (err, tasks) {
    if (tasks.length === 0) {
      TodoList.insertMany(initialItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("create a new task!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { kindOfDay: "toDay", newListItems: tasks });
    }
  });
});

//get custom page
app.get("/:customList", function (req, res) {
  const customList = _.capitalize(req.params.customList);
  List.findOne({ name: customList }, function (err, results) {
    if (!err) {
      if (!results) {
        //Create a new list
        const list = new List({
          name: customList,
          items: initialItems,
        });
        list.save();
        res.redirect("/" + customList);
      } else {
        // show a existing list
        res.render("list", {
          kindOfDay: results.name,
          newListItems: results.items,
        });
      }
    }
  });
});

// post in default page
app.post("/", function (req, res) {
  const listTitle = req.body.list;
  const pathName = req.body.lists;
  const item = new TodoList({
    task: listTitle,
  });
  if (pathName === "toDay") {
    item.save();
    res.redirect("/");
  } else {
    //post in custom page

    List.findOne({ name: pathName }, function (err, results) {
      results.items.push(item);
      results.save();
      res.redirect("/" + pathName);
    });
  }
});

//Delete task in default page and custom page
app.post("/delete", function (req, res) {
  const deleteTask = req.body.checkbox;
  const deleteList = req.body.deleteBox;
  if (deleteList === "toDay") {
    TodoList.deleteOne({ _id: deleteTask }, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("delete success");
      }

      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      { name: deleteList },
      { $pull: { items: { _id: deleteTask } } },
      function (err, results) {
        res.redirect("/" + deleteList);
      }
    );
  }
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log(`server is running on port ${port}`);
});
