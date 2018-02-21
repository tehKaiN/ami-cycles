function copListParseList(sContent) {
	var pLines = sContent.split('\n');
	var pLinesOut = [];

	// Remove excess whitespace
	for(var i = 0; i < pLines.length; ++i) {
		var sCleanerLine = pLines[i].trim();
		if(sCleanerLine != '' /* C line */) {
			sLineC = copListParseCallC(sCleanerLine);
			CopLine = {
				isValid: true,
				sLine : `${sLineC.sCmd}(${sLineC.pArgs.join(',')})`
			};
			if(sLineC.sCmd.toLowerCase() == 'copsetwait') {
				CopLine.sCmdType = 'wait';
				try {
					CopLine.Pos = {
						nX: eval(sLineC.pArgs[1]),
						nY: eval(sLineC.pArgs[2])
					};
				} catch(Err) {
					CopLine.isValid = false;
				}
			}
			else if(sLineC.sCmd.toLowerCase() == 'copsetmove') {
				CopLine.sCmdType = 'move';
			}
			else {
				// Unknown C command
				continue;
			}
			pLinesOut.push(CopLine);
		}
		else if(0 /* ASM line */) {
			// TODO
		}
		else {
			// TODO: some error
		}
	}
	return pLinesOut;
}

copListParseCallC = function(sExpr) {
	var Result = {};

	var nPos = sExpr.indexOf('(');
	if(nPos == -1)
		return false;
	Result.sCmd = sExpr.substr(0, nPos);
	Result.pArgs = [];
	var nArgIdx = 0;
	var nBraceCount = 0;
	for(var i = nPos; i != sExpr.length; ++i) {
		if(sExpr[i] == '(') {
			++nBraceCount;
		}
		else if(sExpr[i] == ')') {
			--nBraceCount;
			if(nBraceCount == 0) {
				return Result;
			}
		}
		else if(sExpr[i] == ',' && nBraceCount == 1) {
			++nArgIdx;
		}
		else if(sExpr[i].trim() != '') {
			// All printable chars
			if(void 0 == Result.pArgs[nArgIdx]) {
				Result.pArgs[nArgIdx] = '';
			}
			Result.pArgs[nArgIdx] += sExpr[i];
		}
	}
	return false;
}
