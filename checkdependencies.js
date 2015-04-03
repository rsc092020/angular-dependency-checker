'use strict';
module.exports = function (grunt) {
    //TODO: look up how to do this as like a node module (npm) or something
    //TODO: use esprima
    grunt.registerMultiTask('checkdeps', 'Checks usage of dependencies of controller, service, directive, run, filter, and factory', function () {
        var angularStructureRegex = /angular\.module\(.+\)\.(controller|service|factory|run|directive|filter)\([\s\S]+?\}\s*\]\s*\)\s*;/g,
            structureHeaderRegex = /function\s*\(.*\)/,
            structureHeaderRestrictiveRegex = /function\s*\(.+\)/,
            dependencyNamesRegex = /\[('.+?',?\s*)+/;

        var remove = grunt.option('remove') || false;
        var totalUnusedDependencies = 0;

        grunt.log.writeln('\nPossible unused dependencies:');
        grunt.log.writeln('===========================================================');

        this.files.forEach(function (file) {

            file.src.forEach(function (fileName) {
                var fileContents = grunt.file.read(fileName),
                    angularStructures = fileContents.match(angularStructureRegex),
                    fileInfo = fileName + ':\n',
                    hasUnusedDependencies = false;

                if(angularStructures) {
                    angularStructures.forEach(function (angularStructure) {
                        // full controller, service, etc...
                        var newAngularStructure = angularStructure;
                        // everything inside the main function of the angular structure
                        var structureBody = angularStructure.substring(angularStructure.indexOf('{')+1);
                        // the main function declaration
                        var structureHeaders = angularStructure.match(structureHeaderRegex);

                        if(structureHeaderRestrictiveRegex.test(structureHeaders[0])) {
                            // 'function (dep1, dep2, dep3, dep4, dep5)'
                            var structureHeader = structureHeaders[0];

                            // 'dep1, dep2, dep3, dep4, dep5'
                            var dependencyVarsString = structureHeader.substring(structureHeader.indexOf('(')+1, structureHeader.length-1);
                            var newDependencyVarsString = dependencyVarsString;
                            // ['dep1', 'dep2', 'dep3', 'dep4', 'dep5']
                            var dependencyVarsList = dependencyVarsString.split(/,\s*/);
                            // ['dep1, ', 'dep2, ', 'dep3, ', 'dep4, ', 'dep5']
                            var nonTrimmedDependencyVarsList = dependencyVarsString.match(/.+?(\s+|$)/g);

                            // [', ',   ', ',   ', ',   ', ']
                            var dependencyVarsSeparators = dependencyVarsString.match(/,\s*/g);
                            // ', '
                            var lastSeparator = dependencyVarsSeparators ? dependencyVarsSeparators.pop() : '';

                            // "['dep1', 'dep2', 'dep3', 'dep4', 'dep5', "
                            var newDependencyNamesString = newAngularStructure.match(dependencyNamesRegex)[0];
                            // ["'dep1', ",   "'dep2', ",   "'dep3', ",   "'dep4', ",   "'dep5', "]
                            var nonTrimmedDependencyNamesList = newDependencyNamesString.match(/'.+?',?\s*/g);

                            dependencyVarsList.forEach(function (dep, index, array) {
                                var bodyContainsDependency = structureBody.indexOf(dep);
                                if(bodyContainsDependency === -1) {
                                    newDependencyNamesString = newDependencyNamesString.replace(nonTrimmedDependencyNamesList[index], '');
                                    newDependencyVarsString = newDependencyVarsString.replace((index === array.length-1 ? lastSeparator : '') + nonTrimmedDependencyVarsList[index], '');

                                    fileInfo += '  ' + dep + '\n';
                                    hasUnusedDependencies = true;
                                    totalUnusedDependencies++;
                                }
                            });
                            newAngularStructure = newAngularStructure.replace(dependencyNamesRegex, newDependencyNamesString);
                            newAngularStructure = newAngularStructure.replace(dependencyVarsString, newDependencyVarsString);
                        }
                        fileContents = fileContents.replace(angularStructure, newAngularStructure);
                    });
                }
                if(hasUnusedDependencies) {
                    if(remove) {
                        grunt.file.write(fileName, fileContents);
                    }
                    grunt.log.write(fileInfo + '\n');
                }
            });
        });
        if(totalUnusedDependencies === 0) {
            grunt.log.writeln('No Unused Dependencies');
        }
        else {
            grunt.log.writeln('===========================================================');
            grunt.log.writeln('Total Number of Unused Dependencies: ' + totalUnusedDependencies);
            grunt.log.write('If any dependencies get removed, then the tests might need to be changed too.');
        }
    });
};


