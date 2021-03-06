import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'

import {CircularProgress, Colors} from 'components/theme'
import {PageWithNavigationBar} from 'components/navigation'
import {editFirstProject, CREATE_PROJECT_SAVE} from 'store/actions'
import {USER_PROFILE_SHAPE} from 'store/user_reducer'
import {Routes} from 'components/url'
import {getOnboardingStep, gotoNextStep, gotoPreviousStep,
  onboardingStepCount} from './profile/onboarding'


class NewProjectPageBase extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    existingProject: PropTypes.object,
    isCreatingProject: PropTypes.bool,
    match: PropTypes.shape({
      params: PropTypes.shape({
        stepName: PropTypes.string,
      }).isRequired,
    }).isRequired,
    userProfile: USER_PROFILE_SHAPE,
  }
  static contextTypes = {
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
    }).isRequired,
    isMobileVersion: PropTypes.bool.isRequired,
  }

  componentWillMount() {
    const {existingProject} = this.props
    const {mobility, ...overrideState} = existingProject || {}
    this.setState({
      areaType: mobility && mobility.areaType || 'CITY',
      city: mobility && mobility.city || null,
      employmentTypes: ['CDI'],
      isIncomplete: true,
      kind: 'FIND_A_NEW_JOB',
      minSalary: null,
      previousJobSimilarity: 'DONE_THIS',
      targetJob: null,
      workloads: ['FULL_TIME'],
      ...overrideState,
    })
    // Prevent people from manually going back and creating another project.
    if (existingProject && !existingProject.isIncomplete) {
      this.context.history.push(Routes.PROJECT_PAGE + '/' + existingProject.projectId)
      return
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.stepName === this.props.match.params.stepName) {
      return
    }
    this.pageDom && this.pageDom.scrollTo(0)
  }

  handleSubmit = newProjectUpdates => {
    const {dispatch, match} = this.props
    const {type} = getOnboardingStep(Routes.NEW_PROJECT_PAGE, match.params.stepName)
    this.setState(newProjectUpdates, () => {
      dispatch(editFirstProject(this.state, type))
      gotoNextStep(Routes.NEW_PROJECT_PAGE, match.params.stepName, dispatch, this.context.history)
    })
  }

  handleBack = () => {
    const {stepName} = this.props.match.params
    // TODO(pascal): Save state when going back as well.
    gotoPreviousStep(Routes.NEW_PROJECT_PAGE, stepName, this.context.history)
  }

  render() {
    const {isCreatingProject, match, userProfile} = this.props
    const {isMobileVersion} = this.context
    const spinnerBoxStyle = {
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 20,
    }
    const style = {
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      paddingBottom: isMobileVersion ? 0 : 70,
      paddingTop: isMobileVersion ? 0 : 70,
    }
    const newProject = {...this.state}
    let content
    if (isCreatingProject) {
      content = <div style={spinnerBoxStyle}><CircularProgress /></div>
    } else {
      const currentStepItem = getOnboardingStep(Routes.NEW_PROJECT_PAGE, match.params.stepName)
      const CurrentStepComponent = currentStepItem.component
      content = <CurrentStepComponent
        onSubmit={this.handleSubmit}
        onPreviousButtonClick={this.handleBack}
        profile={userProfile} newProject={newProject}
        stepNumber={currentStepItem.stepNumber} totalStepCount={onboardingStepCount} />
    }
    return <PageWithNavigationBar
      style={{backgroundColor: Colors.BACKGROUND_GREY}}
      page="new_project" isContentScrollable={true} ref={page => {
        this.page = page
      }}>
      <div style={style}>
        {content}
      </div>
    </PageWithNavigationBar>
  }
}
const NewProjectPage = connect(({app, asyncState, user}) => ({
  existingProject: user.projects && user.projects.length && user.projects[0] || null,
  isCreatingProject: asyncState.isFetching[CREATE_PROJECT_SAVE],
  userProfile: user.profile,
  ...app.newProjectProps,
}))(NewProjectPageBase)


export {NewProjectPage}
