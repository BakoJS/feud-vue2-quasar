<template>
  <q-page class="flex flex-center">
    <div id="feud_admin" class="section categories">
        <div class="container">
            <div class="row">
                <div class="four columns"><h3 class="section-heading">Developer Feud</h3></div>
                <div class="eight columns">
                    <button style="margin-right:6px" v-for="u in userList" :key="u.id" :class="{'active': (u.id == activeUser)}" @click="changeUser(u.id)">{{u.name}}</button>
                </div>
            </div>

            <div class="row">
                <div class="four columns">
                    <button class="twelve column button-secondary" @click="addNewQuestion()">Add New Question</button>
                        <input class="u-full-width" type="text" v-model="searchText" placeholder="Search Questions">
                    <ul class="container-list">
                        <li v-for="q in filteredQuestionDB" :key="q.QuestionID" >
                            <a href="javascript:void(0)"
                                :class="{'active': (q.QuestionID == activeQuestion)}"
                                class="list-link"
                                @click="editQuestion(q)">{{q.QuestionText}}</a>
                        </li>
                    </ul>
                </div>
                <div class="eight columns">
                    <label for="">Question</label>
                    <div class="row" style="padding: 5px">
                            <textarea class="eight columns" v-model="formData.QuestionText"></textarea>
                            <button class=" four columns button-secondary" @click="saveQuestion()">Save Question</button>
                    </div>
                    <div class="row">

                        <div class="six columns">
                            <ul>
                                <li v-for="a in orderedQuestionAnswers" :key="a.AnswerText">
                                    <span class="text-block">{{a.AnswerText}}</span>
                                    <span class="count">{{a.AnswerVotes}}</span>
                                    <a href="javascript:void(0)" @click="toggleVote(a)" class="icon-list-block"><i :class="checkVote(a)" class="fa-heart"></i></a>
                                    <a href="javascript:void(0)" @click="deleteAnswer(a)" class="icon-list-block"><i class="fas fa-times-circle"></i></a>
                                </li>
                            </ul>
                        </div>

                        <div class="six columns" v-show="formData.QuestionID > 0">

                            <label>Answer: </label>
                            <input type="text" v-model="formData.AnswerText"  @keyup.enter="addAnswer()">
                            <button class="button-primary" @click="addAnswer()">Add Answer</button>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </q-page>
</template>

<style>
</style>

<script>
import { axiosInstance } from 'plugins/axios'

export default {
  name: 'PageIndex',
  data () {
    return {
      activeUser: 1,
      userList: [
        { id: 1, name: "Admin" },
        { id: 2, name: "User 1" },
        { id: 3, name: "User 2" },
        { id: 4, name: "User 3" },
        { id: 5, name: "User 4" }
      ],
      questionDB: [],
      searchText: "",
      idxQuestions: {},
      formData: {
        QuestionID: 0,
        QuestionText: "",
        AnswerText: ""
      },
      upvotedAnswers: []
    }
  },
  computed: {
    filteredQuestionDB () {
      var self = this
      return self.questionDB.filter(function ( question ) {
        return question.QuestionText.indexOf( self.searchText ) !== -1
      })
    },
    orderedQuestionAnswers () {
      if (this.idxQuestions.hasOwnProperty(this.formData.QuestionID)){
        return  _.orderBy( this.idxQuestions[this.formData.QuestionID].Answers , 'QuestionText');
      } else {
        return [];
      }
    }
  },
  http: {},
  created: function() {
    var _self = this;
    this.changeUser(1);
    this.idxQuestions = {};
    axiosInstance.get("/questions").then(function(res) {
      _self.questionDB = res.body;
      _self.questionDB.forEach(function(q, i) {
        _self.idxQuestions[q.QuestionID] = q;
      });
    });
  },
  methods: {
    changeUser: function(userID) {
      this.activeUser = userID;
      this.getUserVotes();
    },
    getUserVotes: function() {
      var _self = this;
      axiosInstance
        .post("/uservotes", { userID: this.activeUser })
        .then(function(res) {
          console.log(res);
          _self.upvotedAnswers = res.body;
        });
    },
    checkVote: function(answer) {
      return this.upvotedAnswers.indexOf(answer.AnswerID) != -1 ? "fas" : "far";
    },
    editQuestion: function(question) {
      this.formData.QuestionID = question.QuestionID;
      this.formData.QuestionText = question.QuestionText;
      this.formData.AnswerText = "";
    },
    saveQuestion: function() {
      var _self = this;
      axiosInstance
        .post("/question", {
          questionID: this.formData.QuestionID,
          questionText: this.formData.QuestionText
        })
        .then(function(res) {
          var result = res.body[0];
          console.log(result);
          for (var i in result) {
            _self.idxQuestions[result.QuestionID][i] = result[i];
          }
        });
    },
    getQuestionAnswers: function() {
      if (this.idxQuestions.hasOwnProperty(this.formData.QuestionID))
        return this.idxQuestions[this.formData.QuestionID].Answers;
      return [];
    },
    addAnswer: function() {
      if (this.formData.AnswerText == "") return false;
      var _self = this;
      axiosInstance
        .post("/answer", {
          questionID: this.formData.QuestionID,
          answerText: this.formData.AnswerText,
          userID: this.activeUser
        })
        .then(function(res) {
          var result = res.body;

          _self.idxQuestions[_self.formData.QuestionID]["Answers"].push(result);
          _self.upvotedAnswers.push(result.AnswerID);
          _self.formData.AnswerText = "";
        });
    },
    toggleVote: function(answer) {
      var _self = this;
      var wasUpvoted = this.upvotedAnswers.indexOf(answer.AnswerID) != -1;
      var endpoint = wasUpvoted ? "unvote" : "vote";
      axiosInstance
        .post("/" + endpoint, {
          answerID: answer.AnswerID,
          userID: this.activeUser
        })
        .then(function(res) {
          var result = res.body;
            console.log(result);
          for (var i in result) {
            answer[i] = result[i];
          }

          if (wasUpvoted) {
            _self.upvotedAnswers.splice(_self.upvotedAnswers.indexOf(answer.AnswerID),1);
          } else {
            _self.upvotedAnswers.push(answer.AnswerID)
          }
        });
    }
  }
}
</script>
