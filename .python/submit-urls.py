import os
import re
import sys
import time
import json
import pytz
import logging
import datetime
import requests
from lxml import etree
from itertools import groupby
from html.parser import HTMLParser
from xml.dom.minidom import parse
import xml.dom.minidom

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

def convert_datetime(input):
    d = re.findall(r'\d{4}-\d{1,2}-\d{1,2}', input)[0]
    t = re.findall(r'\d{2}:\d{2}:\d{2}', input)[0]
    dt = '%s %s' % (d, t)
    return datetime.datetime.strptime(dt, '%Y-%m-%d %H:%M:%S')

def load_urls_from_sitemap(sitemap_url):
    session = requests.session()
    response = session.get(sitemap_url)
    with open('sitemap.xml','w',encoding='utf-8') as sitemap:
        sitemap.write(response.text);
        
    DOMTree = xml.dom.minidom.parse('./sitemap.xml')
    root = DOMTree.documentElement
    urls = root.getElementsByTagName("url")
    for url in urls:
        # loc
        loc = url.getElementsByTagName("loc")[0]
        loc = loc.childNodes[0].data
        # lastmod
        print(url.getElementsByTagName("lastmod"))
        lastmod = url.getElementsByTagName("lastmod")[0]
        lastmod = lastmod.childNodes[0].data
        lastmod = convert_datetime(lastmod)
        yield (loc, lastmod)
        
def submit_urls_by_baidu(items):
    querystring = {"site": "blog.yuanpei.me", "token": "RDl7DmfXeoWMVvWP"}
    headers = {
        'User-Agent': "curl/7.12.1",
        'Content-Type': "text/plain",
    }
    
    total = len(items)
    session = requests.session()

    for item in items:
        payload = item[0]
        try:
            response = session.request("POST", 'http://data.zz.baidu.com/urls', data=payload, headers=headers, params=querystring)
            logger.info(f'Submit Result => {response.text}')
            response = json.loads(response.text)
            if response["success"] == 1:
                total -= 1
            if response["remain"] == 0:
                break
        except Exception as e:
            logger.error(f'Submit Failed => {str(e)}')
            continue

def submit_urls_by_bing(items):
    url = f'https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=713A48A3FE17D4841C292A6B3942EB4C'
    headers = { 'Content-Type': 'application/json' }
     
    urls = list(map(lambda x:x[0], items))
    data = json.dumps({
        'siteUrl': 'blog.yuanpei.me',
        'urlList': urls
    })

    try:
        response = requests.post(url, headers=headers, data=data)
        logger.info(f'Submit Result => {response.text}')
    except Exception as e:
        logger.error(f'Submit Failed => {str(e)}')

if __name__ == "__main__":
    sitemapUrl = sys.argv[1]
    items = list(load_urls_from_sitemap(sitemapUrl))
    submit_urls_by_baidu(items)
    submit_urls_by_bing(items)
