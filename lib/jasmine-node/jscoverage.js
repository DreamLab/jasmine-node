
var fs = require('fs');
var child = require('child_process'); 

var JsCoverage = function(config){
    this._config = config;
    /*
    node-jscoverage
    ./lib
    ./lib_cov
    ./lib_org
     
     */
    
};

JsCoverage.prototype.prepare = function(cb){
    child.exec("node-jscoverage ./lib ./lib_cov", function(error){
    	if (error) {
    		throw error;
    	}
    	fs.renameSync("lib", "lib_org");
    	fs.renameSync("lib_cov", "lib");
        cb();
    });
};


JsCoverage.prototype.coverageReport = function(cb) {
      var rv = {};
      
      if(!global._$jscoverage){
         console.log('Nie wykryto JSCoverage!');
         return;
      }
      
      for( var file_name in global._$jscoverage ) {
    
        var jscov = global._$jscoverage[ file_name ]; 
    
        var file_report = rv[ file_name ] = {
          coverage: new Array( jscov.length ),
          source:   new Array( jscov.length )
        };
    
        for( var i=0; i < jscov.length; ++i ) {
          var hit_count = jscov[ i ] !== undefined ? jscov[ i ] : null;
          file_report.coverage[ i ] = hit_count;
          file_report.source[ i ]   = jscov.source[ i ];
        }
      }
    
      /*
      for(var j=0;j<excludeFilesFromResult.length;j++){
        if(rv.hasOwnProperty(excludeFilesFromResult[j])){
         console.log('Excluding from results: ' + excludeFilesFromResult[j]);
         delete rv[excludeFilesFromResult[j]];
        }
      }
      */
      var filesWithoutTests = [];
      var excludeFilesFromResult = [
        'mootools/mootools-node.js'
      ];
      
      function _cacheRecursive(path){
        var matches = null;
        var fs = require('fs');
        var statInfo = null;
        var testFilePath = null;
        var excludePattern = {'.svn':'exclude', 'mootools-node.js':'exclude'};
        var files = fs.readdirSync(path);
    
        for(var i = 0, l = files.length; i < l; i++){
            if(!excludePattern.hasOwnProperty(files[i])){
               var newpath = path + files[i];
               statInfo = fs.statSync(newpath);
               if(statInfo.isDirectory()){
                   _cacheRecursive(newpath+'/');
               } else {
                   testFilePath = ('./tests/'+newpath.replace('.js', 'Spec.js')).replace('./tests/lib/', './tests/');
    
                   try{
                       fs.statSync(testFilePath)
                   } catch(e){
                        // nie ma testu dla pliku
                        filesWithoutTests.push(newpath.replace('lib/', ''));
                   }
               }
           }
        }
      }; 
      _cacheRecursive('lib/');
    
      console.log("\nFiles without tests:")
      console.log(filesWithoutTests);
      console.log("\n");
    
      for(var ex=0;ex<filesWithoutTests.length;ex++){
        if(rv.hasOwnProperty(filesWithoutTests[ex])){
           rv[filesWithoutTests[ex]].noTest = true;
        } else {
           rv[filesWithoutTests[ex]] = {coverage:[0], source:[null]};
           rv[filesWithoutTests[ex]].noTest = true;
        }
      }   
      
      console.log('writing code coverage analysis...');
      
      var resultsPath = '/tmp/jscoverage.json';
      try{
        var fs=require('fs');
        fs.writeFileSync(resultsPath, JSON.stringify(rv), 'utf8');
        console.log('code coverage analysis written: ' + resultsPath);
      } catch(e){
        console.log(e);
      }
      
      function removeDir(path){
    	if(fs.statSync(path).isDirectory()){
    		var files = fs.readdirSync(path);
    
    		for(var i = 0, l = files.length; i < l; i++){
    			if(fs.statSync(path + '/' + files[i]).isFile()){
    				fs.unlinkSync(path + '/' + files[i]);
    			}else if(fs.statSync(path + '/' + files[i]).isDirectory()){
    				removeDir(path + '/' + files[i])
    			}
    		}
    		fs.rmdirSync(path);
    	}
      }
      
      removeDir("lib");
	  fs.renameSync("lib_org", "lib");
            
      cb();
  };


exports.JsCoverage = JsCoverage;