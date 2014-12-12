var school_records = require('./school_records').init('./data/school.db');
exports.get_grades = function(req,res){
	school_records.getGrades(function(err,grades){
		res.render('grades',{grades:grades});
	});
};

exports.get_students = function(req,res){
	school_records.getStudentsByGrade(function(err,grades){
		res.render('students',{grades:grades});
	});
};

exports.get_subjects = function(req,res){
	school_records.getSubjectsByGrade(function(err,grades){
		res.render('subjects',{grades:grades});
	});
};

exports.get_student = function(req,res,next){
	school_records.getStudentSummary(req.params.id,
		function(err,student){
			if(!student){ 
				res.send('Student of this ID does not exists'); 
				next();
			}
			else 
				res.render('student',student);
		});
};

exports.get_subject_summary = function(req,res,next){
	school_records.getSubjectSummary(req.params.id,
	function(err,subject){
		if(!subject) 
			next();
		else 
			res.render('subject',subject);
	});
};

exports.update_grade_name = function(req, res, next){
	var new_grade = req.body;
	new_grade.id = req.params.id;
	school_records.updateGrade(new_grade,function(err){
		res.writeHead(302,{"Location": "/grades/"+new_grade.id});
		res.end();
	});
};

// var renameGrade = function(req,res){
// 	var id = req.path[req.path.length-1];
// 	var new_grade = {id:id,newname:req.query.newname};
// 	school_records.updateGrade(new_grade,function(err){
// 		res.writeHead(302,{"Location": "/grades/"+id});
// 		res.end();
// 	});
// };

exports.get_grade_summary = function(req,res,next){
	// if(req.query.newname){
	// 	renameGrade(req,res);
	// 	return; 
	// }
	school_records.getGradeSummary(req.params.id,function(err,grade){		
		if(!grade){
			res.send('Grade does not exists');
			next();
		}
		else
			res.render('grade',grade);
	});
};

exports.edit_student_summary = function(req,res,next){
	school_records.getStudentSummary(req.params.id,function(err,student){
		if(!student){
			next();
		}
		else 
			res.render('editStudentSummary',student);
	});
};

exports.update_student_summary = function(req,res,next){
	var new_student = req.body;
	new_student.studentId = req.params.id;
	school_records.updateStudentSummary(new_student,function(err){
		if(err){
			res.end("Invalid Data");
		}
		res.writeHead(302,{"Location": "/students/"+new_student.studentId});
		res.end();
	})
};

exports.edit_subject_summary = function(req,res,next){
	school_records.getSubjectSummary(req.params.id,function(err,subject){
		if(!subject)
			next();
		else{
			res.render('editSubjectSummary',subject);
		}
	});
};

exports.update_subject_summary = function(req,res,next){
	var new_subject = req.body;
	new_subject.subjectId = +req.params.id;
	school_records.updateSubjectSummary(new_subject,function(err){
		if(err){
			res.end('Invalid Data');
		}
		res.writeHead(302,{"Location": "/subject/"+new_subject.subjectId});
		res.end();
	});
};

exports.add_new_student = function(req,res,next){
	var new_student = req.body;
	new_student.gradeId = +req.params.id;
	school_records.addNewStudent(new_student,function(err){
		if(err){
			res.send("Invalid data");
		}
		else{
			res.writeHead(302,{'Location':"/grades/"+new_student.gradeId});
			res.end();
		}
	});
};

exports.add_new_subject = function(req,res,next){
	var new_subject = req.body;
	new_subject.gradeId = +req.params.id;
	school_records.addNewSubject(new_subject,function(err){
		if(err){
			res.send("Invalid data");
		}
		else{
			res.writeHead(302,{'Location':"/grades/"+new_subject.gradeId});
			res.end();
		}
	});
};

exports.update_score = function(req,res,next){
	var new_score = req.body;
	school_records.updateScore(new_score,function(err){
		if(err){
			res.send('Invalid data');
		}
		else{
			res.writeHead(302,{'Location':"/subject/"+req.params.id});
			res.end();
		};
	})
}