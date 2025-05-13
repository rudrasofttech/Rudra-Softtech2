import React, { Component } from 'react';
import { Route } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { CustomPageList } from './components/CustomPageList';
import { LoginForm } from './components/LoginForm';
import { ArticleList } from './components/ArticleList';
import { CustomDataSourceList } from './components/CustomDataSourceList';
import { CategoryList } from './components/CategoryList';
import { MemberList } from './components/MemberList';
import { WebsiteSettings } from './components/WebsiteSettings';
import { CustomPageManage } from './components/CustomPageManage';
import { ArticleManage } from './components/ArticleManage';
import { DataSourceManage } from './components/DataSourceManage';
import { CategoryManage } from './components/CategoryManage';
import { EmailList } from './components/EmailList';
import { NewsletterDesign } from './components/NewsletterDesign';
import { ChangePassword } from './components/ChangePassword';
import { Logout } from './components/Logout';

export default class App extends Component {
    displayName = App.name

    render() {
        return (
            <Layout>
                <Route exact path='/' component={Home} />
                <Route path='/custompagelist' component={CustomPageList} />
                <Route path='/LoginForm' component={LoginForm} />
                <Route path='/articlelist' component={ArticleList} />
                <Route path='/Logout' component={Logout} />
                <Route path='/CustomDataSourceList' component={CustomDataSourceList} />
                <Route path='/CategoryList' component={CategoryList} />
                <Route path='/EmailList' component={EmailList} />
                <Route path='/MemberList' component={MemberList} />
                <Route path='/WebsiteSettings' component={WebsiteSettings} />
                <Route path='/NewsletterDesign' component={NewsletterDesign} />
                <Route path='/custompagemanage/:id?' component={CustomPageManage} />
                <Route path='/ArticleManage/:id?' component={ArticleManage} />
                <Route path='/DataSourceManage/:id?' component={DataSourceManage} />
                <Route path='/CategoryManage/:id?' component={CategoryManage} />
                <Route path='/ChangePassword/:id?' component={ChangePassword} />
            </Layout>
        );
    }
}


