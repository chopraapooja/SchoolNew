var sqlite3 = require("sqlite3").verbose();

var _getGrades = function(db,onComplete){
	var q = 'select * from grades';
	db.all(q,onComplete);
};

var filterStudentsByGrade = function(students, grades){
	grades.forEach(function(g){	// filterStudentsByGrade
		g.students = students.filter(function(s){return s.grade_id==g.id});
	});
}

var _getStudentsByGrade = function(db,onComplete){
	_getGrades(db,function(err,grades){		
		db.all('select * from students', function(err1,students){
			filterStudentsByGrade(students, grades);
			onComplete(null,grades);
		});
	});
};

var filterSubjectsByGrade = function(subjects, grades){
	grades.forEach(function(g){
		g.subjects = subjects.filter(function(s){return s.grade_id==g.id});
	});
};

var _getSubjectsByGrade = function(db,onComplete){
	_getGrades(db,function(err,grades){		
		db.all('select * from subjects', function(err1,subjects){
			filterSubjectsByGrade(subjects, grades);			
			onComplete(null,grades);
		});
	});	
};

var _getStudentSummary = function(id, db,onComplete){
	var student_grade_query = 'select s.name as name, s.id as id, g.name as grade_name, g.id as grade_id '+
		'from students s, grades g where s.grade_id = g.id and s.id='+id;
	var subject_score_query = 'select su.name, su.id, su.maxScore, sc.score '+
		'from subjects su, scores sc '+
		'where su.id = sc.subject_id and sc.student_id ='+id;
	db.get(student_grade_query,function(est,student){
		if(!student){
			onComplete(null,null);
			return;
		}
		db.all(subject_score_query,function(esc,subjects){			
			student.subjects = subjects;
			onComplete(null,student);
		})
	});
};
var getStudentOfaGrade =function(grade,db,onComplete,id){
	var student_query = "select id,name from students where grade_id="+id;
	var subject_query = "select id,name from subjects where grade_id="+id;
	db.all(student_query,function(est,students){
		grade.students = students;
		db.all(subject_query,function(esu,subjects){
			grade.subjects = subjects;
			onComplete(null,grade);		
		});
	});
}

var _getGradeSummary = function(id,db,onComplete){
	var grade_query = "select id,name from grades where id="+id;
	db.get(grade_query,function(err,grade){
		getStudentOfaGrade(grade,db,onComplete,id)
	});
};

var _updateGrade = function(new_grade,db,onComplete){
	var query = "update grades set name='"+new_grade.newname+"' where id="+new_grade.id;
	db.run(query,onComplete);
}



var _getSubjectSummary = function(id,db,onComplete){
	var subject_query = "select id,maxScore,name,grade_id from subjects where id="+id;
	db.get(subject_query,function(err,subject){
		var grade_query = "select name as grade_name from grades where id="+subject.grade_id;
		var student_score_query = "select st.id as student_id,st.name as student_name, sc.score as score from students st, scores sc where st.id=sc.student_id and st.grade_id="+subject.grade_id+" and sc.subject_id="+id;
		db.get(grade_query,function(egr,grade){
			subject.grade_name = grade.grade_name;
			db.all(student_score_query,function(esc,score){
				subject.score=score;
				onComplete(null,subject);
			});
		});
	});
}

var getSubjectIds = function(new_student){
	var expression = new RegExp(/^subId_/);
	var ids = Object.keys(new_student).filter(function(key){
		return key.match(expression) && key;
	});
	return ids.map(function(id){
		return id.split('_')[1];
	})

}
var updateStudentGradeId = function(new_student,db){
	db.get("select id from grades where name='"+new_student.gradeName+"'",function(egr,grade){
		if(!grade){
			egr=true;
			return;
		}
		new_student.gradeId = grade.id;
		var grade_query = "update students set grade_id='" + new_student.gradeId+"' where id="+new_student.studentId;
		db.run(grade_query,function(egr){
			egr && console.log(egr);
		});
	});
};

var updateSubjectGradeId = function(new_subject,db,onComplete){
	db.get("select id from grades where name='"+new_subject.gradeName+"'",function(egr,grade){
		if(!grade){
			egr=true;
			return;
		}
		new_subject.gradeId = grade.id;
		var grade_query = "update subjects set grade_id='" + new_subject.gradeId+"' where id="+new_subject.subjectId;
		db.run(grade_query,onComplete);
	});
};

var updateName = function(tableName,name,id,db){
	var update_query = "update " + tableName+ " set name='"+name+"' where id="+id;
	db.run(update_query,function(err){
		err && console.log(err);
	});
};

var updateScore = function(tableName,max_score,id,db){
	var update_query = "update " + tableName+ " set maxScore='"+max_score+"' where id="+id;
	db.run(update_query,function(err){
		err && console.log(err);
	});
};

var updateStudentScore = function(new_student,db,onComplete){
	var ids = getSubjectIds(new_student);
	ids.forEach(function(id,index,array){
		var score_query = "update scores set score='"+new_student["subId_"+id]+"' where subject_id="+id+" and student_id="+new_student.studentId ;
		db.serialize(function(err){
			db.run(score_query,function(esc){
				index==array.length-1 && onComplete(null);
			});
		});
	});
};

var _updateStudentSummary = function(new_student,db,onComplete){
	updateStudentGradeId(new_student,db);
	updateName("students",new_student.studentName,new_student.studentId,db);
	updateStudentScore(new_student,db,onComplete);
};


var _updateSubjectSummary = function(new_subject,db,onComplete){
	updateName("subjects",new_subject.subjectName,new_subject.subjectId,db);
	updateScore("subjects",new_subject.maxScore,new_subject.subjectId,db);
	updateSubjectGradeId(new_subject,db,onComplete);
};
//SELECT * FROM TABLE WHERE ID = (SELECT MAX(ID) FROM TABLE);
var _addNewStudent = function(new_student,db,onComplete){
	var insert_query = "insert into students (name,grade_id) values('"+new_student.studentName+"',"+new_student.gradeId+")";
	var selectLastStudentID = "select * from students where id=(select MAX(id) from students)";
	var selectSubjectsIds = "select id from subjects where grade_id ="+new_student.gradeId;	

	db.run(insert_query, function(err){
		err && console.log(err);

		db.get(selectLastStudentID, function(err, student){
			err && console.log(err);

			db.all(selectSubjectsIds, function(err, subjectIds){
				err && console.log(err);

				subjectIds.forEach(function(subject, index, subjects){
	
					var insert_into_score = "insert into scores (student_id, subject_id) values ("+student.id+","+subject.id+" )";
					db.run(insert_into_score, function(err){
						err && console.log(err);
						index==subjects.length-1 && onComplete(null);
					});
				});
			});

		});
	});
};

var _addNewSubject = function(new_subject,db,onComplete){
	var insert_query = "insert into subjects (name,maxScore,grade_id) values('"+new_subject.subject_name+"',"+new_subject.maxScore+","+new_subject.gradeId+")";
	var subject_query = "select * from subjects where grade_id="+new_subject.grade_id;
	db.run(insert_query,onComplete);	
};

// var _getSubjectDetails = function(id,db,onComplete){
// 	var query = "select id,name as subject_name,grade_id,maxScore from subjects where id="+id;
// 	db.all(query , function(err, subjectSummary){
// 		console.log("subject in record",subjectSummary);
// 		onComplete(err , subjectSummary);
// 	});
// };

var init = function(location){	
	var operate = function(operation){
		return function(){
			var onComplete = (arguments.length == 2)?arguments[1]:arguments[0];
			var arg = (arguments.length == 2) && arguments[0];

			var onDBOpen = function(err){
				if(err){onComplete(err);return;}
				db.run("PRAGMA foreign_keys = 'ON';");
				arg && operation(arg,db,onComplete);
				arg || operation(db,onComplete);
				db.close();
			};
			var db = new sqlite3.Database(location,onDBOpen);
		};	
	};

	var records = {		
		getGrades: operate(_getGrades),
		getStudentsByGrade: operate(_getStudentsByGrade),
		getSubjectsByGrade: operate(_getSubjectsByGrade),
		getStudentSummary: operate(_getStudentSummary),
		getGradeSummary: operate(_getGradeSummary),
		getSubjectSummary: operate(_getSubjectSummary),
		updateGrade : operate(_updateGrade),
		updateStudentSummary : operate(_updateStudentSummary),
		updateSubjectSummary : operate(_updateSubjectSummary),
		addNewStudent:operate(_addNewStudent),
		addNewSubject:operate(_addNewSubject),
	};
	return records;
};



exports.init = init;