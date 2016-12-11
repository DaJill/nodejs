function Person(_sName, _iAge){
	this.sName = _sName;
	this.iAge = _iAge;
}

Person.prototype.getIntroduction = function() {
	return 'Hi! My name is ' + this.sName + ' . I\'m '+ this.iAge + ' years old. Nice to meet you.';
};

module.exports = Person;