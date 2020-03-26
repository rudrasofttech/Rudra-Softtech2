import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
export class Home extends Component {
  displayName = Home.name

  render() {
      return (
          <Redirect to="/custompagelist" />
    );
  }
}
