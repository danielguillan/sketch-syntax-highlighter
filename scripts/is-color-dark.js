module.exports = function isColorDark(color) {
	color = color.trim().toLowerCase();
	var length = color.length,
		firstChar = color[0], _255=255,h=[],s, l=/[\d.*]+/g;
	if (/(^#?[a-f\d]+$)|\d/.test(color)){
		if (firstChar == "h") {

			while(s=l.exec(color)){
				h.push(s[0])
			}
			s=h[1]/100;
			l=h[2]/100;
			var q = l < 0.5 ? l * (1 + s) : l + s - l * s,
			    p = 2 * l - q;
			    h = h[0] / 100;
			color = [h+1/3,h,h-1/3].map(function(t,c){
      				return (((c=q-p,t+=t<0?1:t>1?-1:0)<1/6?p+6*c*t:.5>t?q:t<2/3?p+c*(2/3-t)*6:p)*_255)+.5|0;
    			});
		}
		else if (firstChar == "r") {
			//rgb or rgba
			while(s=l.exec(color.replace(/%/g,"*2.55"))){
				h.push(s[0])
			};
			color=h.map(eval);
		} else {
			color = [(z = "0x"+/\w{6}/.exec(color.replace(length<6&&/./g,'$&$&'))) >> 16 & _255,
				z >> 8 & _255,
				z & _255
			];
		}
		return color[0] * 299 + color[1] * 587 + color[2] * 114 < 128000
	}
	// This should only get keynames for colors, because we did HSL, HSLA, RGB, RGBA and HEX before

	/* What is this ? It is the most compressed way I found to deal with colors keynames. I found this throught computer
	   and manual calculations. Each dark color is assigned a unique 2-ASCII-characters code generated from its name. */
	return !("bIb=b*bRcLcRdYdad{dcdRdgdHd*dndKdofifGf(gSi{iimum>mom;m\\mnnmoMoWo{p,r.r?rUscs#s8sUsWs{t*th".indexOf(
		firstChar + String.fromCharCode((color.charCodeAt(628 % length) * length) % 91 + 33)
	) % 2);
}