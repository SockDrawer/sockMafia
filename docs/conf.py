from recommonmark.parser import CommonMarkParser
import os
from os.path import join, getsize

os.system('npm install')

for root, dirs, files in os.walk('../src'):
	for name in files:
		if name.endswith('.js'):
			docname = os.path.join(root, name.replace('.js', '.md'))
			try:
				os.makedirs(os.path.join('./', root))
				break
			except OSError, e:
				if e.errno != 17:
					raise   
				pass
			os.system('jsdoc2md {1} > ./{2}'.format(os.path.join(root, name), docname))

source_parsers = {
    '.md': CommonMarkParser,
}

source_suffix = ['.md']