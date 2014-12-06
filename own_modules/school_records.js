var sqlite3 = require("sqlite3").verbose();

var _getGrades = function(db,onComplete){
	var q = 'select * from grades';
	db.all(q,onComplete);
};

var _getStudentsByGrade = function(db,onComplete){
	_getGrades(db,function(err,grades){		
		db.all('select * from students', function(err1,students){
			
			grades.forEach(function(g){
				g.students = students.filter(function(s){return s.grade_id==g.id});
			})			
			onComplete(null,grades);
		})
	});	
};

var _getSubjectsByGrade = function(db,onComplete){
	_getGrades(db,function(err,grades){		
		db.all('select * from subjects', function(err1,subjects){
			
			grades.forEach(function(g){
				g.subjects = subjects.filter(function(s){return s.grade_id==g.id});
			})			
			onComplete(null,grades);
		})
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

var _getGradeSummary = function(id,db,onComplete){
	var student_query = "select id,name from students where grade_id="+id;
	var subject_query = "select id,name from subjects where grade_id="+id;
	var grade_query = "select id,name from grades where id="+id;
	db.get(grade_query,function(err,grade){
		db.all(student_query,function(est,students){
			grade.students = students;
			db.all(subject_query,function(esu,subjects){
				grade.subjects = subjects;
				onComplete(null,grade);		
			});
		});
	});
};

var _updateGrade = function(new_grade,db,onComplete){
	var query = "update grades set name='"+new_grade.newname+"' where id="+new_grade.id;
	db.run(query,onComplete);
}

var _getSubjectSummary = function(id,db,onComplete){
	var query  = ['select sb.id as subject_id, sb.name as subject_name,',
	' sb.maxScore, g.id as  grade_id, g.name as grade_name,',
	' st.name as',
	'  student_name, st.id as student_id, sc.score',
	' as score from students st, grades g,',
	' subjects sb, scores sc where sb.id =',id,
	' and sc.subject_id = ',id,
	' and sc.student_id = st.id ',
	'and st.grade_id = g.id'].join('');
	console.log(query);

	db.all(query , function(err, subjectSummary){
		onComplete(null , subjectSummary);
	})
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
			egr && console.log(egr)
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
		updateSubjectSummary : operate(_updateSubjectSummary)
	};

	return records;
};

exports.init = init;