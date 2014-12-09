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

var getSubjectsWithScore = function(studentId, db, onComplete){
	var subject_score_query = 'select su.name, su.id, su.maxScore, sc.score '+
	'from subjects su, scores sc '+
	'where su.id = sc.subject_id and sc.student_id ='+studentId;

	db.all(subject_score_query,onComplete);
};

var _getStudentSummary = function(id, db,onComplete){
	var student_grade_query = 'select s.name as name, s.id as id, g.name as grade_name, g.id as grade_id '+
		'from students s, grades g where s.grade_id = g.id and s.id='+id;

	db.get(student_grade_query,function(est,student){
		if(!student){
			onComplete(null,null);
			return;
		}
		getSubjectsWithScore(id, db, function(err, subjects){
			student.subjects = subjects;
			onComplete(null, student);
		});
	});
};
var getSubjectsOfGrade = function(id,db,onComplete){
	var subject_query = "select id,name from subjects where grade_id="+id;
	db.all(subject_query, onComplete);
};

var getStudentsOfaGrade =function(id,db,onComplete){
	var student_query = "select id,name from students where grade_id="+id;
	db.all(student_query,onComplete);
};

var getGradeDetails = function(grade, db, onComplete){
	getStudentsOfaGrade(grade.id, db, function(err, students){
		grade.students = students;
		getSubjectsOfGrade(grade.id, db, function(err, subjects){
			grade.subjects = subjects;
			onComplete(null, grade);
		});
	});
};

var _getGradeSummary = function(id,db,onComplete){
	var grade_query = "select id,name from grades where id="+id;
	db.get(grade_query,function(err,grade){
		getGradeDetails(grade,db,onComplete)
	});
};

var _updateGrade = function(new_grade,db,onComplete){
	var query = "update grades set name='"+new_grade.newname+"' where id="+new_grade.id;
	db.run(query,onComplete);
};

var getSubjectScores = function(subject, db, onComplete){
	var student_score_query = "select st.id as student_id,"+
	" st.name as student_name,"+
	" sc.score as score from students st,"+
	" scores sc"+
	" where st.id=sc.student_id and st.grade_id="+subject.grade_id+" and sc.subject_id="+subject.id;
	
	db.all(student_score_query, function(err, scores){
		subject.score=scores;
		onComplete(null,subject);
	});
};

var _getSubjectSummary = function(id,db,onComplete){
	var subject_query = "select id,maxScore,name,grade_id from subjects where id="+id;
	db.get(subject_query,function(err,subject){
		var grade_query = "select name as grade_name from grades where id="+subject.grade_id;
		db.get(grade_query,function(egr,grade){
			subject.grade_name = grade.grade_name;	
			getSubjectScores(subject, db, onComplete);
		});
	});
};

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
		var score_query = "update scores set score='"+new_student["subId_"+id]+
		"' where subject_id="+id+" and student_id="+new_student.studentId ;

		db.serialize(function(err){
			db.run(score_query,function(esc){
				index==array.length-1 && onComplete(null);
			});
		});
	});
};

var _updateStudentSummary = function(new_student,db,onComplete){
	updateName("students",new_student.studentName,new_student.studentId,db);
	updateStudentGradeId(new_student,db);
	updateStudentScore(new_student,db,onComplete);
};

var _updateSubjectSummary = function(new_subject,db,onComplete){
	updateName("subjects",new_subject.subjectName,new_subject.subjectId,db);
	updateScore("subjects",new_subject.maxScore,new_subject.subjectId,db);
	updateSubjectGradeId(new_subject,db,onComplete);
};

var addSubjectScores = function(subjectIds,student,db,onComplete){
	subjectIds.forEach(function(subject, index, subjects){
		var insert_into_score = "insert into scores (student_id, subject_id) values ("+
			student.id+","+subject.id+" )";
		db.run(insert_into_score, function(err){
			err && console.log(err);
			index==subjects.length-1 && onComplete(null);
		});
	});
};

var createNewStudentInScores = function(new_student,db,onComplete){
	var selectLastStudentID = "select MAX(id) as id from students";
	var selectSubjectsIds = "select id from subjects where grade_id ="+new_student.gradeId;	
	
	db.get(selectLastStudentID, function(err, student){
		err && console.log(err);

		db.all(selectSubjectsIds, function(err, subjectIds){
			err && console.log(err);
			addSubjectScores(subjectIds,student,db,onComplete)
		});
	});
};

var _addNewStudent = function(new_student,db,onComplete){
	var insert_query = "insert into students (name,grade_id) values('"+
		new_student.studentName+"',"+new_student.gradeId+")";

	db.run(insert_query, function(err){
		err && console.log(err);
		createNewStudentInScores(new_student,db,onComplete);
	});
};

var addStudentScores = function(studentIds,subject,db,onComplete){
	studentIds.forEach(function(student, index, students){
		var insert_into_score = "insert into scores (student_id, subject_id) values ("+
			student.id+","+subject.id+" )";
		db.run(insert_into_score, function(err){
			err && console.log(err);
			index==students.length-1 && onComplete(null);
		});
	});
};

var createNewSubjectInScores = function(new_subject,db,onComplete){
	var lastSubjectID = "select MAX(id) as id from subjects";
	var selectStudentsIds = "select id from students where grade_id="+new_subject.gradeId;
	
	db.get(lastSubjectID, function(err, subject){
		err && console.log(err);

		db.all(selectStudentsIds, function(err, studentIds){
			err && console.log(err);
			addStudentScores(studentIds,subject,db,onComplete);
		});
	});
};

var _addNewSubject = function(new_subject,db,onComplete){
	var insert_query = "insert into subjects (name,maxScore,grade_id) values('"+
			new_subject.subject_name+"',"+new_subject.maxScore+","+new_subject.gradeId+")";

	db.run(insert_query, function(err){
		err && console.log(err);
		createNewSubjectInScores(new_subject,db,onComplete);
	});
};

var getIds = function(key){
	var ids = {};
	ids.subjectId = key.split('_')[1];
	ids.studentId = key.split('_')[2];
	return ids;
};

var _updateScore = function(new_score,db,onComplete){
	var key = Object.keys(new_score)[0]
	var ids = getIds(key);
	var update_score_query = 'update scores set score = "'+new_score[key]+'" where subject_id='+
	ids.subjectId+ ' and student_id = '+ ids.studentId;
	db.run(update_score_query,onComplete);	
}

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
		updateScore : operate(_updateScore)
	};
	return records;
};

exports.init = init;