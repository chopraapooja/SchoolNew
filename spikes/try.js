var knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: "../data/try.db"
  }
});

knex.select('*').from('students').exec(function(err, data){
	console.log(err, "=========1111",data);
});

knex.select('*').from('').exec(function(err, data){
	console.log(err, "=========2222",data);
});

