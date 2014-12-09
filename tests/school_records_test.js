var lib = require('../own_modules/school_records');
var assert = require('chai').assert;
var fs = require('fs');
var dbFileData = fs.readFileSync('tests/data/school.db.backup');
//CREATE TABLE STUDENTS(name text, grade text);
//INSERT INTO STUDENTS VALUES ('Abu','one'), ('Babu','one')

var school_records;
describe('school_records',function(){
	beforeEach(function(){
		fs.writeFileSync('tests/data/school.db',dbFileData);
		school_records = lib.init('tests/data/school.db');
	});
	
	describe('#getGrades',function(){
		it('retrieves 2 grades',function(done){
			school_records.getGrades(function(err,grades){
				assert.deepEqual(grades,[{id:1,name:'1st std'},{id:2,name:'2nd std'}]);
				done();
			});
		});
	});

	describe('#getStudentsByGrade',function(){
		it('retrieves the students in the 2 grades',function(done){
			school_records.getStudentsByGrade(function(err,grades){
				assert.lengthOf(grades,2);
				assert.lengthOf(grades[0].students,4);
				assert.lengthOf(grades[1].students,3);
				done();
			});
		});
	});

	describe('#getSubjectsByGrade',function(){
		it('retrieves the subjects in the 2 grades',function(done){
			school_records.getSubjectsByGrade(function(err,grades){
				assert.lengthOf(grades,2);
				assert.lengthOf(grades[0].subjects,3);
				assert.lengthOf(grades[1].subjects,0);
				done();
			});
		});
	});

	describe('#getStudentSummary',function(){
		it('retrieves the summary of the student Abu',function(done){
			school_records.getStudentSummary(1, function(err,s){				
				assert.equal(s.name,'Abu');
				assert.equal(s.grade_name,'1st std');
				assert.deepEqual(s.subjects,[{id:1,name:'English-1',score:75,maxScore:100},
					{id:2,name:'Maths-1',score:50,maxScore:100},
					{id:3,name:'Moral Science',score:25,maxScore:50}]);
				done();
			});
		});

		it('retrieves nothing of the non existent student',function(done){
			school_records.getStudentSummary(9, function(err,s){
				assert.notOk(err);
				assert.notOk(s);				
				done();
			});
		});
	});

	describe('#getGradeSummary',function(){
		it('retrieves the summary of grade 1',function(done){
			school_records.getGradeSummary(1,function(err,grade){
				assert.notOk(err);
				assert.equal(grade.name,'1st std');
				assert.deepEqual(grade.subjects,[{id:1,name:'English-1'},
					{id:2,name:'Maths-1'},
					{id:3,name:'Moral Science'}]);
				assert.deepEqual(grade.students,[{id:1,name:'Abu'},
					{id:2,name:'Babu'},
					{id:3,name:'Kabu'},
					{id:4,name:'Dabu'}]);
				assert.equal(grade.id,1);
				done();
			});
		});
	});

	describe('#getSubjectSummary',function(){
		it('retrieves the summary of subject 1',function(done){
			school_records.getSubjectSummary(1,function(err,subject){
				assert.notOk(err);
				assert.equal(subject.name,'English-1');
				assert.deepEqual(subject, { id: 1,
					  	maxScore: 100,
  						name: 'English-1',
  						grade_id: 1,
  						grade_name: '1st std',
  						score: [ { student_id: 1, student_name: 'Abu', score: 75 } ] });
				done();
			});
		});
	});

	describe('#renameGrade',function(){
		it('edits the grade name',function(done){
			school_records.updateGrade({id:1,newname:'class--1'},function(err){
				assert.notOk(err);
				school_records.getGradeSummary(1,function(egs,grade){
					assert.deepEqual(grade.name,'class--1');
					done();
				});
			});
		});
	});

	describe('#updateStudentSummary',function(){
		it('update student summary',function(done){
			var newStudent = {studentId:1,studentName:'Vishnu',
							gradeName:'2nd std',subId_1:20,subId_2:23,subId_3:50};
			var expected1 = [{id:1,name:'English-1',score:20,maxScore:100},
							{id:2,name:'Maths-1',score:23,maxScore:100},
							{id:3,name:'Moral Science',score:50,maxScore:50}];

			var expected2 =  [{ name: 'Maths-1', id: 2, maxScore: 100, score: 200 }];		

			school_records.updateStudentSummary(newStudent,function(err){
				assert.notOk(err);
				school_records.getStudentSummary(2,function(ess,s2){
					assert.equal(s2.name,'Babu');
					assert.equal(s2.grade_name,'1st std');
					assert.deepEqual(s2.subjects,expected2);

					school_records.getStudentSummary(1,function(ess,s1){
						assert.equal(s1.name,'Vishnu');
						assert.equal(s1.grade_id,'2');
						assert.deepEqual(s1.subjects,expected1);
						done();
					});
				});
			});
		});
	});

	describe('#updateSubjectSummary',function(){
		it('update subject[name,max score and grade id]',function(done){
			var editedSubject = {subjectName:'comedy' ,subjectId:1,maxScore:75,gradeName:'2nd std'};
			var expected =  {id:1,name: 'comedy', maxScore: 75, grade_name: "2nd std", grade_id: 2 };

			school_records.updateSubjectSummary(editedSubject, function(err){
				assert.notOk(err);
				school_records.getSubjectSummary(1,function(err,subject){
					assert.notOk(err);
					assert.equal(subject.name,'comedy');
					assert.deepEqual(subject, { id: 1,
						  	maxScore: 75,
	  						name: 'comedy',
	  						grade_id: 2,
	  						grade_name: '2nd std',
	  						score: [] });
					done();
				});
			});
		});
	});

	describe('#addNewStudent',function(){
		it('add a new student in students table',function(done){
			var newStudent = {studentName:'chopra',gradeId:1};
			var expectedSubjects = [{id:1,name:'English-1',score:null,maxScore:100},
										{id:2,name:'Maths-1',score:null,maxScore:100},
										{id:3,name:'Moral Science',score:null,maxScore:50}];
			school_records.addNewStudent(newStudent,function(err){
				assert.notOk(err);
				school_records.getStudentSummary(8, function(err,s){			
					assert.equal(s.name,'chopra');
					assert.equal(s.grade_name,'1st std');
					assert.equal(s.grade_id,1);
					assert.deepEqual(s.subjects, expectedSubjects);
					done();
				});
			});
		});
	});

	describe('#addNewSubject',function(){
		it('add a new subject in subjects table',function(done){
			var newSubject = {subject_name:'cricket',gradeId:2,maxScore:100};
			school_records.addNewSubject(newSubject,function(err){
				var expectedScore = [{ student_id: 5, student_name: 'Kaapi', score: null },
    								{ student_id: 6, student_name: 'Paapi', score: null },
     								{ student_id: 7, student_name: 'Beepi', score: null } ];
				assert.notOk(err);
				school_records.getSubjectSummary(4,function(err,subject){
					assert.notOk(err);
					assert.equal(subject.name,'cricket');
					assert.deepEqual(subject, { id: 4,
						  	maxScore: 100,
	  						name: 'cricket',
	  						grade_id: 2,
	  						grade_name: '2nd std',
	  						score: expectedScore});
					done();
				});
			});
		});
	});
});